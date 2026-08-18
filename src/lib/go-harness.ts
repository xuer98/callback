// Go judging harness for the Judge0 sandbox — same shape as Java/C++:
//
//   [prelude: helpers over encoding/json]  [user code]  [driver]  [main]
//
// Per-problem drivers implement `func __call(a []interface{}) interface{}`.
// Go has JSON in the standard library, so the prelude is mostly conversion
// helpers plus a normalizer that makes nil slices/maps compare as [] and {}
// (rather than null) — otherwise idiomatic Go solutions fail for no reason.
//
// Every import must be used or the build fails, so packages meant for the
// user's code are held live with blank references.
//
// Written with String.raw so backslashes stay literal in the emitted Go.

const GO_PRELUDE = String.raw`
package main

import (
	"container/heap"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"os"
	"reflect"
	"sort"
	"strconv"
	"strings"
	"time"
)

// Kept live for solutions that need them; Go rejects unused imports.
var (
	_ = sort.Ints
	_ = strings.Split
	_ = strconv.Itoa
	_ = math.Abs
	_ = fmt.Sprint
	_ = heap.Init
)

func JList(v interface{}) []interface{} {
	if v == nil {
		return nil
	}
	return v.([]interface{})
}

func JMap(v interface{}) map[string]interface{} {
	if v == nil {
		return nil
	}
	return v.(map[string]interface{})
}

func JInt(v interface{}) int { return int(v.(float64)) }

func JFloat(v interface{}) float64 { return v.(float64) }

func JStr(v interface{}) string {
	if v == nil {
		return ""
	}
	return v.(string)
}

func JBool(v interface{}) bool { return v.(bool) }

func JInts(v interface{}) []int {
	items := JList(v)
	out := make([]int, 0, len(items))
	for _, x := range items {
		out = append(out, int(x.(float64)))
	}
	return out
}

// Null elements come through as empty strings.
func JStrs(v interface{}) []string {
	items := JList(v)
	out := make([]string, 0, len(items))
	for _, x := range items {
		out = append(out, JStr(x))
	}
	return out
}

func JIntGrid(v interface{}) [][]int {
	items := JList(v)
	out := make([][]int, 0, len(items))
	for _, x := range items {
		out = append(out, JInts(x))
	}
	return out
}

func JIntMap(v interface{}) map[string]int {
	out := map[string]int{}
	for k, x := range JMap(v) {
		out[k] = int(x.(float64))
	}
	return out
}

func JStrsMap(v interface{}) map[string][]string {
	out := map[string][]string{}
	for k, x := range JMap(v) {
		out[k] = JStrs(x)
	}
	return out
}

// Normalizes so equality matches the other runners: nil slices/maps become
// empty rather than null, pointers are followed, and map keys are strings.
func __norm(v interface{}) interface{} {
	if v == nil {
		return nil
	}
	rv := reflect.ValueOf(v)
	switch rv.Kind() {
	case reflect.Slice, reflect.Array:
		out := make([]interface{}, 0, rv.Len())
		for i := 0; i < rv.Len(); i++ {
			out = append(out, __norm(rv.Index(i).Interface()))
		}
		return out
	case reflect.Map:
		out := map[string]interface{}{}
		for _, k := range rv.MapKeys() {
			out[fmt.Sprint(k.Interface())] = __norm(rv.MapIndex(k).Interface())
		}
		return out
	case reflect.Ptr:
		if rv.IsNil() {
			return nil
		}
		return __norm(rv.Elem().Interface())
	}
	return v
}

// Canonical JSON: Go sorts map keys, so equality is a string compare.
func __canon(v interface{}) string {
	var buf strings.Builder
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	if err := enc.Encode(__norm(v)); err != nil {
		return fmt.Sprint(v)
	}
	return strings.TrimRight(buf.String(), "\n")
}
`;

function goMain(entry: string, payloadB64: string, marker: string): string {
  return String.raw`
func __safeCall(a []interface{}) (result interface{}, errMsg string, threw bool) {
	defer func() {
		if r := recover(); r != nil {
			threw = true
			errMsg = fmt.Sprint(r)
		}
	}()
	result = ` + entry + String.raw`(a)
	return
}

func main() {
	const marker = ${JSON.stringify(marker)}
	const payloadB64 = ${JSON.stringify(payloadB64)}

	raw, err := base64.StdEncoding.DecodeString(payloadB64)
	if err != nil {
		panic(err)
	}
	var payload struct {
		Tests []struct {
			Name     string        ` + "`json:\"name\"`" + String.raw`
			Input    []interface{} ` + "`json:\"input\"`" + String.raw`
			Expected interface{}   ` + "`json:\"expected\"`" + String.raw`
		} ` + "`json:\"tests\"`" + String.raw`
	}
	if err := json.Unmarshal(raw, &payload); err != nil {
		panic(err)
	}

	realStdout := os.Stdout
	verdicts := []map[string]interface{}{}
	all := true

	for i, test := range payload.Tests {
		shown := make([]string, 0, len(test.Input))
		for _, arg := range test.Input {
			shown = append(shown, __canon(arg))
		}
		expected := __canon(test.Expected)

		reader, writer, _ := os.Pipe()
		os.Stdout = writer
		done := make(chan string)
		go func() {
			var sb strings.Builder
			io.Copy(&sb, reader)
			done <- sb.String()
		}()

		start := time.Now()
		result, errMsg, threw := __safeCall(test.Input)
		ms := float64(time.Since(start).Nanoseconds()) / 1e6

		writer.Close()
		os.Stdout = realStdout
		captured := <-done
		reader.Close()

		got := "—"
		if !threw {
			got = __canon(result)
		}
		pass := !threw && got == expected
		if !pass {
			all = false
		}

		logs := []string{}
		if captured != "" {
			for _, line := range strings.Split(strings.TrimRight(captured, "\n"), "\n") {
				if len(logs) >= 50 {
					break
				}
				logs = append(logs, line)
			}
		}

		name := test.Name
		if name == "" {
			name = "Case " + strconv.Itoa(i+1)
		}
		v := map[string]interface{}{
			"name":     name,
			"input":    strings.Join(shown, ", "),
			"expected": expected,
			"got":      got,
			"pass":     pass,
			"timeMs":   ms,
			"logs":     logs,
		}
		if threw {
			v["error"] = errMsg
		}
		verdicts = append(verdicts, v)
	}

	status := "fail"
	if all {
		status = "pass"
	}
	out, _ := json.Marshal(map[string]interface{}{"status": status, "verdicts": verdicts})
	fmt.Fprintf(realStdout, "\n%s%s\n", marker, string(out))
}
`;
}

/** Assembles the full Go program Judge0 compiles as main.go. */
export function buildGoSource(
  code: string,
  driverCode: string,
  entry: string,
  payloadB64: string,
  marker: string,
): string {
  return [GO_PRELUDE, code, driverCode, goMain(entry, payloadB64, marker)].join(
    "\n",
  );
}
