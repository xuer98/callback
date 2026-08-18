// Java judging harness for the Judge0 sandbox. Java can't eval source at
// runtime, so unlike the JS/Python harnesses the user's code is compiled in:
//
//   [prelude: Json + parser/serializer]  [user code]  [Driver]  [Main]
//
// Per-problem drivers implement `Json __call(List<Json> a)`, unpacking the
// shared JSON test payload into typed arguments. Verdicts match the other
// runners: canonical-JSON equality, captured stdout as logs, per-case timing.
//
// Written with String.raw so backslashes stay literal in the emitted Java.

const JAVA_PRELUDE = String.raw`
import java.io.*;
import java.util.*;
import java.util.function.*;

final class Json {
  static final int NUL = 0, BOOL = 1, NUM = 2, STR = 3, ARR = 4, OBJ = 5;
  final int t;
  boolean b;
  double n;
  String s;
  List<Json> a;
  LinkedHashMap<String, Json> o;

  private Json(int type) { this.t = type; }

  static final Json NULL = new Json(NUL);

  static Json of(boolean v) { Json j = new Json(BOOL); j.b = v; return j; }
  static Json of(double v) { Json j = new Json(NUM); j.n = v; return j; }
  static Json of(int v) { return of((double) v); }
  static Json of(long v) { return of((double) v); }
  static Json of(String v) { if (v == null) return NULL; Json j = new Json(STR); j.s = v; return j; }
  static Json ofList(List<Json> items) { Json j = new Json(ARR); j.a = new ArrayList<Json>(items); return j; }
  static Json ofMap(Map<String, Json> f) { Json j = new Json(OBJ); j.o = new LinkedHashMap<String, Json>(f); return j; }

  static Json ofInts(int[] v) {
    List<Json> r = new ArrayList<Json>();
    for (int x : v) r.add(of(x));
    return ofList(r);
  }
  static Json ofLongs(long[] v) {
    List<Json> r = new ArrayList<Json>();
    for (long x : v) r.add(of(x));
    return ofList(r);
  }
  static Json ofStrings(String[] v) {
    List<Json> r = new ArrayList<Json>();
    for (String x : v) r.add(of(x));
    return ofList(r);
  }
  static Json ofIntGrid(int[][] v) {
    List<Json> r = new ArrayList<Json>();
    for (int[] row : v) r.add(ofInts(row));
    return ofList(r);
  }
  static Json ofIntList(List<Integer> v) {
    List<Json> r = new ArrayList<Json>();
    for (Integer x : v) r.add(x == null ? NULL : of(x.intValue()));
    return ofList(r);
  }
  static Json ofStringList(List<String> v) {
    List<Json> r = new ArrayList<Json>();
    for (String x : v) r.add(of(x));
    return ofList(r);
  }
  static Json ofIntMap(Map<String, Integer> m) {
    LinkedHashMap<String, Json> r = new LinkedHashMap<String, Json>();
    for (Map.Entry<String, Integer> e : m.entrySet()) r.put(e.getKey(), of(e.getValue().intValue()));
    return ofMap(r);
  }
  static Json ofIndexMap(Map<Integer, Integer> m) {
    LinkedHashMap<String, Json> r = new LinkedHashMap<String, Json>();
    for (Map.Entry<Integer, Integer> e : m.entrySet()) r.put(String.valueOf(e.getKey()), of(e.getValue().intValue()));
    return ofMap(r);
  }

  boolean isNull() { return t == NUL; }
  boolean isArr() { return t == ARR; }
  boolean isObj() { return t == OBJ; }
  boolean isNum() { return t == NUM; }
  boolean isStr() { return t == STR; }
  double num() { return n; }
  int asInt() { return (int) n; }
  long asLong() { return (long) n; }
  String str() { return s; }
  boolean bool() { return b; }
  List<Json> list() { return a; }
  Map<String, Json> map() { return o; }
  int size() { return t == ARR ? a.size() : (t == OBJ ? o.size() : 0); }
  Json at(int i) { return a.get(i); }
  Json key(String k) { Json v = (t == OBJ) ? o.get(k) : null; return v == null ? NULL : v; }
  boolean has(String k) { return t == OBJ && o.containsKey(k); }

  int[] ints() {
    int[] r = new int[a.size()];
    for (int i = 0; i < r.length; i++) r[i] = a.get(i).asInt();
    return r;
  }
  long[] longs() {
    long[] r = new long[a.size()];
    for (int i = 0; i < r.length; i++) r[i] = a.get(i).asLong();
    return r;
  }
  /** Null elements come through as Java nulls. */
  String[] strings() {
    String[] r = new String[a.size()];
    for (int i = 0; i < r.length; i++) r[i] = a.get(i).isNull() ? null : a.get(i).str();
    return r;
  }
  int[][] intGrid() {
    int[][] r = new int[a.size()][];
    for (int i = 0; i < r.length; i++) r[i] = a.get(i).ints();
    return r;
  }
  List<Integer> intList() {
    List<Integer> r = new ArrayList<Integer>();
    for (Json j : a) r.add(Integer.valueOf(j.asInt()));
    return r;
  }
  List<String> stringList() {
    List<String> r = new ArrayList<String>();
    for (Json j : a) r.add(j.isNull() ? null : j.str());
    return r;
  }
  Map<String, Integer> intMap() {
    LinkedHashMap<String, Integer> r = new LinkedHashMap<String, Integer>();
    for (Map.Entry<String, Json> e : o.entrySet()) r.put(e.getKey(), Integer.valueOf(e.getValue().asInt()));
    return r;
  }
  Map<String, List<String>> stringListMap() {
    LinkedHashMap<String, List<String>> r = new LinkedHashMap<String, List<String>>();
    for (Map.Entry<String, Json> e : o.entrySet()) r.put(e.getKey(), e.getValue().stringList());
    return r;
  }

  static String numStr(double d) {
    if (Double.isNaN(d) || Double.isInfinite(d)) return "null";
    if (d == Math.rint(d) && Math.abs(d) < 1e15) return Long.toString((long) d);
    return Double.toString(d);
  }

  static void esc(StringBuilder sb, String v) {
    sb.append('"');
    for (int i = 0; i < v.length(); i++) {
      char c = v.charAt(i);
      if (c == '"') sb.append("\\\"");
      else if (c == '\\') sb.append("\\\\");
      else if (c == '\n') sb.append("\\n");
      else if (c == '\r') sb.append("\\r");
      else if (c == '\t') sb.append("\\t");
      else if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
      else sb.append(c);
    }
    sb.append('"');
  }

  // Canonical form: object keys sorted, so equality is a string compare.
  private void write(StringBuilder sb) {
    if (t == NUL) { sb.append("null"); return; }
    if (t == BOOL) { sb.append(b ? "true" : "false"); return; }
    if (t == NUM) { sb.append(numStr(n)); return; }
    if (t == STR) { esc(sb, s); return; }
    if (t == ARR) {
      sb.append('[');
      for (int i = 0; i < a.size(); i++) { if (i > 0) sb.append(','); a.get(i).write(sb); }
      sb.append(']');
      return;
    }
    List<String> keys = new ArrayList<String>(o.keySet());
    Collections.sort(keys);
    sb.append('{');
    for (int i = 0; i < keys.size(); i++) {
      if (i > 0) sb.append(',');
      esc(sb, keys.get(i));
      sb.append(':');
      o.get(keys.get(i)).write(sb);
    }
    sb.append('}');
  }

  public String toString() { StringBuilder sb = new StringBuilder(); write(sb); return sb.toString(); }

  static Json parse(String src) {
    int[] p = new int[] {0};
    Json v = parseValue(src, p);
    return v;
  }

  private static void ws(String s, int[] p) {
    while (p[0] < s.length() && Character.isWhitespace(s.charAt(p[0]))) p[0]++;
  }

  private static Json parseValue(String s, int[] p) {
    ws(s, p);
    char c = s.charAt(p[0]);
    if (c == '{') {
      p[0]++;
      LinkedHashMap<String, Json> m = new LinkedHashMap<String, Json>();
      ws(s, p);
      if (s.charAt(p[0]) == '}') { p[0]++; return ofMap(m); }
      for (;;) {
        ws(s, p);
        String k = parseString(s, p);
        ws(s, p);
        p[0]++; // ':'
        m.put(k, parseValue(s, p));
        ws(s, p);
        char d = s.charAt(p[0]++);
        if (d == '}') break;
      }
      return ofMap(m);
    }
    if (c == '[') {
      p[0]++;
      List<Json> items = new ArrayList<Json>();
      ws(s, p);
      if (s.charAt(p[0]) == ']') { p[0]++; return ofList(items); }
      for (;;) {
        items.add(parseValue(s, p));
        ws(s, p);
        char d = s.charAt(p[0]++);
        if (d == ']') break;
      }
      return ofList(items);
    }
    if (c == '"') return of(parseString(s, p));
    if (c == 't') { p[0] += 4; return of(true); }
    if (c == 'f') { p[0] += 5; return of(false); }
    if (c == 'n') { p[0] += 4; return NULL; }
    int start = p[0];
    while (p[0] < s.length() && "+-0123456789.eE".indexOf(s.charAt(p[0])) >= 0) p[0]++;
    return of(Double.parseDouble(s.substring(start, p[0])));
  }

  private static String parseString(String s, int[] p) {
    StringBuilder sb = new StringBuilder();
    p[0]++; // opening quote
    for (;;) {
      char c = s.charAt(p[0]++);
      if (c == '"') break;
      if (c != '\\') { sb.append(c); continue; }
      char e = s.charAt(p[0]++);
      if (e == 'n') sb.append('\n');
      else if (e == 't') sb.append('\t');
      else if (e == 'r') sb.append('\r');
      else if (e == 'b') sb.append('\b');
      else if (e == 'f') sb.append('\f');
      else if (e == 'u') { sb.append((char) Integer.parseInt(s.substring(p[0], p[0] + 4), 16)); p[0] += 4; }
      else sb.append(e);
    }
    return sb.toString();
  }
}
`;

function javaMain(entry: string, payloadB64: string, marker: string): string {
  return String.raw`
public class Main {
  static final String MARKER = ${JSON.stringify(marker)};
  static final String PAYLOAD = ${JSON.stringify(payloadB64)};

  public static void main(String[] argv) throws Exception {
    PrintStream realOut = System.out;
    Json payload = Json.parse(new String(Base64.getDecoder().decode(PAYLOAD), "UTF-8"));
    List<Json> tests = payload.key("tests").list();
    List<Json> verdicts = new ArrayList<Json>();
    boolean all = true;

    for (int i = 0; i < tests.size(); i++) {
      Json test = tests.get(i);
      List<Json> input = test.key("input").list();
      String expected = test.key("expected").toString();

      StringBuilder shown = new StringBuilder();
      for (int k = 0; k < input.size(); k++) {
        if (k > 0) shown.append(", ");
        shown.append(input.get(k).toString());
      }

      ByteArrayOutputStream buf = new ByteArrayOutputStream();
      System.setOut(new PrintStream(buf, true, "UTF-8"));
      long start = System.nanoTime();
      String got = "—";
      String error = null;
      try {
        Json result = Driver.` + entry + String.raw`(input);
        got = (result == null ? Json.NULL : result).toString();
      } catch (Throwable e) {
        error = e.toString();
      }
      double ms = (System.nanoTime() - start) / 1e6;
      System.setOut(realOut);

      boolean pass = error == null && got.equals(expected);
      if (!pass) all = false;

      List<Json> logs = new ArrayList<Json>();
      String captured = buf.toString("UTF-8");
      if (captured.length() > 0) {
        String[] lines = captured.split("\n", -1);
        for (int k = 0; k < lines.length && logs.size() < 50; k++) {
          if (k == lines.length - 1 && lines[k].isEmpty()) break;
          logs.add(Json.of(lines[k]));
        }
      }

      LinkedHashMap<String, Json> v = new LinkedHashMap<String, Json>();
      v.put("name", Json.of(test.key("name").isNull() ? ("Case " + (i + 1)) : test.key("name").str()));
      v.put("input", Json.of(shown.toString()));
      v.put("expected", Json.of(expected));
      v.put("got", Json.of(got));
      v.put("pass", Json.of(pass));
      if (error != null) v.put("error", Json.of(error));
      v.put("timeMs", Json.of(ms));
      v.put("logs", Json.ofList(logs));
      verdicts.add(Json.ofMap(v));
    }

    LinkedHashMap<String, Json> out = new LinkedHashMap<String, Json>();
    out.put("status", Json.of(all ? "pass" : "fail"));
    out.put("verdicts", Json.ofList(verdicts));
    realOut.println();
    realOut.println(MARKER + Json.ofMap(out).toString());
  }
}
`;
}

/** Assembles the full Java program Judge0 compiles as Main.java. */
export function buildJavaSource(
  code: string,
  driverCode: string,
  entry: string,
  payloadB64: string,
  marker: string,
): string {
  return [
    JAVA_PRELUDE,
    code,
    "\nclass Driver {\n" + driverCode + "\n}\n",
    javaMain(entry, payloadB64, marker),
  ].join("\n");
}
