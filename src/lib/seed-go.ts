import type { JudgeLanguage } from "./types";

// Go judge definitions, keyed by problem slug, merged into each problem's
// judge as judge.go by the seed script. Tests are shared across languages.
//
// The harness (go-harness.ts) compiles the user's code in and each driver
// implements `func __call(a []interface{}) interface{}`, unpacking the
// shared JSON payload into typed arguments. Helpers:
//   JInts(a[0]) / JStrs / JIntGrid / JIntMap / JStrsMap / JList / JMap
//   JInt(a[1]) / JStr / JBool / JFloat
// Returned values are marshaled with encoding/json, and nil slices/maps are
// normalized to [] and {}. fmt, sort, strings, strconv, math, and
// container/heap are already imported — solutions must not add imports.

export const goJudges: Record<string, JudgeLanguage> = {
  "pair-sum-sorted": {
    entry: "__call",
    starterCode: `func pairSum(numbers []int, target int) []int {
	// numbers is sorted ascending. Return []int{i, j} with i < j, or {-1, -1}.
	return []int{-1, -1}
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	return pairSum(JInts(a[0]), JInt(a[1]))
}`,
  },
  "merge-intervals": {
    entry: "__call",
    starterCode: `func mergeIntervals(intervals [][]int) [][]int {
	// intervals are [start, end] pairs in any order.
	// Return the merged intervals sorted by start.
	return intervals
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	return mergeIntervals(JIntGrid(a[0]))
}`,
  },
  "lru-cache": {
    entry: "__call",
    starterCode: `type LRUCache struct {
	// Your state here
}

func Constructor(capacity int) *LRUCache {
	return &LRUCache{}
}

func (c *LRUCache) Get(key int) int {
	// Return the value, or -1 if absent.
	return -1
}

func (c *LRUCache) Put(key int, value int) {
	// Your code here
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	ops := JList(a[0])
	args := JList(a[1])
	var instance *LRUCache
	out := []interface{}{}
	for i, opRaw := range ops {
		op := JStr(opRaw)
		x := JList(args[i])
		switch op {
		case "LRUCache":
			instance = Constructor(JInt(x[0]))
			out = append(out, nil)
		case "get":
			out = append(out, instance.Get(JInt(x[0])))
		default:
			instance.Put(JInt(x[0]), JInt(x[1]))
			out = append(out, nil)
		}
	}
	return out
}`,
  },
  "course-schedule": {
    entry: "__call",
    starterCode: `func canFinish(numCourses int, prerequisites [][]int) bool {
	// prerequisites [a, b] means b must come before a.
	// Return true if all courses can be finished.
	return true
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	return canFinish(JInt(a[0]), JIntGrid(a[1]))
}`,
  },
  "max-width": {
    entry: "__call",
    starterCode: `func justify(words []string, maxWidth int) []string {
	// Return the justified lines, each exactly maxWidth characters.
	return []string{}
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	return justify(JStrs(a[0]), JInt(a[1]))
}`,
  },
  "round-numeric-strings": {
    entry: "__call",
    starterCode: `// Part 1: round one numeric string to the nearest integer, rounding
// half away from zero. No leading zeros in the result, and never "-0".
// Values can exceed any built-in numeric type - stay in string land.
func roundNumericString(s string) string {
	// Your code here
	return s
}

// Part 2: round every value in a comma-separated list.
func roundAll(csv string) string {
	// Your code here
	return csv
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	if JStr(a[0]) == "csv" {
		return roundAll(JStr(a[1]))
	}
	return roundNumericString(JStr(a[1]))
}`,
  },
  "violation-log-analyzer": {
    entry: "__call",
    starterCode: `// UserCount is one row of TopK: a user and their all-time count.
type UserCount struct {
	User  string
	Count int
}

type ViolationLog struct {
	// Your state here
}

func Constructor() *ViolationLog {
	return &ViolationLog{}
}

// Record ingests one event; timestamps are non-decreasing across calls.
func (l *ViolationLog) Record(timestamp int, userID string, violationType string) {
	// Your code here
}

// CountRecent counts violations by userID in (latest - window, latest].
func (l *ViolationLog) CountRecent(userID string, window int) int {
	return 0
}

// TopK returns the top-k users by all-time count, ties lexicographic.
func (l *ViolationLog) TopK(k int) []UserCount {
	return []UserCount{}
}

// ShouldBan reports whether userID ever had >= maxViolations within any
// window-second span.
func (l *ViolationLog) ShouldBan(userID string, maxViolations int, window int) bool {
	return false
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	ops := JList(a[0])
	args := JList(a[1])
	var log *ViolationLog
	out := []interface{}{}
	for i, opRaw := range ops {
		x := JList(args[i])
		switch JStr(opRaw) {
		case "ViolationLog":
			log = Constructor()
			out = append(out, nil)
		case "record":
			log.Record(JInt(x[0]), JStr(x[1]), JStr(x[2]))
			out = append(out, nil)
		case "countRecent":
			out = append(out, log.CountRecent(JStr(x[0]), JInt(x[1])))
		case "topK":
			rows := [][]interface{}{}
			for _, row := range log.TopK(JInt(x[0])) {
				rows = append(rows, []interface{}{row.User, row.Count})
			}
			out = append(out, rows)
		default:
			out = append(out, log.ShouldBan(JStr(x[0]), JInt(x[1]), JInt(x[2])))
		}
	}
	return out
}`,
  },
  "nested-set-equality": {
    entry: "__call",
    starterCode: `// Nested sets are given as (possibly nested) lists of integers. Go has no
// natural variant type, so both sides arrive as raw decoded JSON: every
// element is either a float64 (an integer member) or a []interface{}
// (a nested set).
// Return true when a and b are equal as sets, at every depth.
func nestedSetEqual(a interface{}, b interface{}) bool {
	// Your code here
	return false
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	return nestedSetEqual(a[0], a[1])
}`,
  },
  "assign-pins-shortest-columns": {
    entry: "__call",
    starterCode: `func assignPins(heights []int, k int) []int {
	// Return the column index assigned to each pin, in order.
	return []int{}
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	return assignPins(JInts(a[0]), JInt(a[1]))
}`,
  },
  "collect-reachable-pins": {
    entry: "__call",
    starterCode: `// boards maps a board id to the pin ids on that board.
// Return every reachable pin id SORTED; empty if start is unknown.
func collectReachablePins(boards map[string][]string, start string) []string {
	// Your code here
	return []string{}
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	return collectReachablePins(JStrsMap(a[0]), JStr(a[1]))
}`,
  },
  "stream-line-reader": {
    entry: "__call",
    starterCode: `type LineReader struct {
	// Your state here
}

// Constructor takes the stream: readChunk returns the next chunk, or the
// empty string once the stream ends.
func Constructor(readChunk func() string) *LineReader {
	return &LineReader{}
}

// ReadLine returns the next complete line without the newline; ok is false
// once the stream is exhausted. Call readChunk lazily.
func (r *LineReader) ReadLine() (line string, ok bool) {
	return "", false
}

// Part 2: lines are "payer,payee,amount" (integer amounts). Return the
// minimum number of transactions to settle all balances (use LineReader).
func settleFromStream(readChunk func() string) int {
	// Your code here
	return 0
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	chunks := JStrs(a[1])
	next := 0
	readChunk := func() string {
		if next >= len(chunks) {
			return ""
		}
		next++
		return chunks[next-1]
	}
	if JStr(a[0]) == "settle" {
		return settleFromStream(readChunk)
	}
	reader := Constructor(readChunk)
	out := []interface{}{}
	for n := JInt(a[2]); n > 0; n-- {
		line, ok := reader.ReadLine()
		if !ok {
			out = append(out, nil)
			break
		}
		out = append(out, line)
	}
	return out
}`,
  },
  "escape-room-leaderboard": {
    entry: "__call",
    starterCode: `type Leaderboard struct {
	// Your state here
}

func Constructor() *Leaderboard {
	return &Leaderboard{}
}

// AddResult records an attempt; only improvements change the standings.
func (lb *Leaderboard) AddResult(team string, seconds int) {
	// Your code here
}

// Rank is the 1-indexed rank by best time (ties alphabetical), or -1.
func (lb *Leaderboard) Rank(team string) int {
	return -1
}

// TopK returns the k best team names, in rank order.
func (lb *Leaderboard) TopK(k int) []string {
	return []string{}
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	ops := JList(a[0])
	args := JList(a[1])
	var lb *Leaderboard
	out := []interface{}{}
	for i, opRaw := range ops {
		x := JList(args[i])
		switch JStr(opRaw) {
		case "Leaderboard":
			lb = Constructor()
			out = append(out, nil)
		case "addResult":
			lb.AddResult(JStr(x[0]), JInt(x[1]))
			out = append(out, nil)
		case "rank":
			out = append(out, lb.Rank(JStr(x[0])))
		default:
			out = append(out, lb.TopK(JInt(x[0])))
		}
	}
	return out
}`,
  },
  "rebalance-experiment-buckets": {
    entry: "__call",
    starterCode: `// current holds the group assigned to each bucket, where "" means the
// bucket is unassigned (JSON null); targets maps group -> desired count.
// Return a new assignment meeting the targets exactly while changing as
// few buckets as possible.
func rebalanceBuckets(current []string, targets map[string]int) []string {
	// Your code here
	return current
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	current := JStrs(a[0])
	targets := JIntMap(a[1])
	argCurrent := append([]string{}, current...)
	argTargets := map[string]int{}
	for g, want := range targets {
		argTargets[g] = want
	}

	result := rebalanceBuckets(argCurrent, argTargets)
	if len(result) != len(current) {
		return map[string]interface{}{"validShape": false}
	}

	counts := map[string]int{}
	for _, g := range result {
		if g != "" {
			counts[g]++
		}
	}
	targetsMet := true
	for g, want := range targets {
		if counts[g] != want {
			targetsMet = false
		}
	}
	for g := range counts {
		if _, ok := targets[g]; !ok {
			targetsMet = false
		}
	}
	changes := 0
	for i := range current {
		if current[i] != result[i] {
			changes++
		}
	}
	return map[string]interface{}{"targetsMet": targetsMet, "changes": changes}
}`,
  },
  "list-unallocated-buckets": {
    entry: "__call",
    starterCode: `// allocated holds inclusive [start, end] ranges in any order, possibly
// overlapping or partly out of bounds (clamp them).
// Return the minimal sorted list of free inclusive ranges within [0, n).
func unallocatedRanges(n int, allocated [][]int) [][]int {
	// Your code here
	return [][]int{}
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	return unallocatedRanges(JInt(a[0]), JIntGrid(a[1]))
}`,
  },
  "adjustable-id-allocator": {
    entry: "__call",
    starterCode: `type IDAllocator struct {
	// Your state here
}

// Constructor builds an allocator whose IDs live in [0, capacity).
func Constructor(capacity int) *IDAllocator {
	return &IDAllocator{}
}

// Allocate returns the smallest available ID, or -1 if none.
func (a *IDAllocator) Allocate() int {
	return -1
}

// Release reports true only if id was currently allocated.
func (a *IDAllocator) Release(id int) bool {
	return false
}

// SetCapacity adjusts capacity up or down; already-issued IDs stay valid.
func (a *IDAllocator) SetCapacity(c int) {
	// Your code here
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	ops := JList(a[0])
	args := JList(a[1])
	var alloc *IDAllocator
	out := []interface{}{}
	for i, opRaw := range ops {
		x := JList(args[i])
		switch JStr(opRaw) {
		case "IDAllocator":
			alloc = Constructor(JInt(x[0]))
			out = append(out, nil)
		case "allocate":
			out = append(out, alloc.Allocate())
		case "release":
			out = append(out, alloc.Release(JInt(x[0])))
		default:
			alloc.SetCapacity(JInt(x[0]))
			out = append(out, nil)
		}
	}
	return out
}`,
  },
  "flag-spam-numbers": {
    entry: "__call",
    starterCode: `// callLog holds [caller, callee] pairs and reports holds
// [reporter, number] pairs. Flag every number with at least minReports
// distinct valid reporters and return the flagged numbers sorted.
func flagSpamNumbers(callLog [][]string, reports [][]string, minReports int) []string {
	// Your code here
	return []string{}
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	pairs := func(v interface{}) [][]string {
		out := [][]string{}
		for _, row := range JList(v) {
			out = append(out, JStrs(row))
		}
		return out
	}
	return flagSpamNumbers(pairs(a[0]), pairs(a[1]), JInt(a[2]))
}`,
  },
  "sparse-matrix-operations": {
    entry: "__call",
    starterCode: `type SparseMatrix struct {
	NRows int
	NCols int
	// Your storage here
}

func Constructor(nRows int, nCols int) *SparseMatrix {
	return &SparseMatrix{NRows: nRows, NCols: nCols}
}

// FromDense builds a matrix from a dense grid of rows.
func FromDense(dense [][]int) *SparseMatrix {
	nCols := 0
	if len(dense) > 0 {
		nCols = len(dense[0])
	}
	// Your code here
	return Constructor(len(dense), nCols)
}

func (m *SparseMatrix) Get(r int, c int) int {
	return 0
}

// Set stores v at (r, c); storing 0 must remove the entry.
func (m *SparseMatrix) Set(r int, c int, v int) {
	// Your code here
}

// Add returns a new matrix and must panic on a dimension mismatch — the
// judge recovers from the panic and scores the case as "error".
func (m *SparseMatrix) Add(other *SparseMatrix) *SparseMatrix {
	// Your code here
	return m
}

// Multiply returns a new matrix and must panic on a dimension mismatch.
func (m *SparseMatrix) Multiply(other *SparseMatrix) *SparseMatrix {
	// Your code here
	return m
}

func (m *SparseMatrix) ToDense() [][]int {
	return [][]int{}
}

// NNZ is the count of stored nonzero entries.
func (m *SparseMatrix) NNZ() int {
	return 0
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	op := JStr(a[0])
	left := FromDense(JIntGrid(a[1]))
	extra := JInts(a[3])
	if op == "get" {
		return left.Get(extra[0], extra[1])
	}
	if op == "set" {
		left.Set(extra[0], extra[1], extra[2])
		return map[string]interface{}{"dense": left.ToDense(), "nnz": left.NNZ()}
	}
	return __combine(op, left, FromDense(JIntGrid(a[2])))
}

// A dimension mismatch panics; the judge reports it as "error".
func __combine(op string, left *SparseMatrix, right *SparseMatrix) (result interface{}) {
	defer func() {
		if recover() != nil {
			result = "error"
		}
	}()
	var out *SparseMatrix
	if op == "add" {
		out = left.Add(right)
	} else {
		out = left.Multiply(right)
	}
	return map[string]interface{}{"dense": out.ToDense(), "nnz": out.NNZ()}
}`,
  },
  "nearest-eligible-elevator": {
    entry: "__call",
    starterCode: `// Elevator describes one car. Direction is "up", "down", or "idle", and
// Serviced lists the floors this elevator stops at.
type Elevator struct {
	ID        int
	Floor     int
	Direction string
	Serviced  []int
}

// Return the nearest eligible elevator's id (ties -> lowest id), or -1.
func selectElevator(elevators []Elevator, floor int, direction string) int {
	// Your code here
	return -1
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	elevators := []Elevator{}
	for _, raw := range JList(a[0]) {
		e := JMap(raw)
		elevators = append(elevators, Elevator{
			ID:        JInt(e["id"]),
			Floor:     JInt(e["floor"]),
			Direction: JStr(e["direction"]),
			Serviced:  JInts(e["serviced"]),
		})
	}
	return selectElevator(elevators, JInt(a[1]), JStr(a[2]))
}`,
  },
  "subsequence-expression-target": {
    entry: "__call",
    starterCode: `// nums are positive integers. Can some subsequence with + and *
// (standard precedence) evaluate exactly to target?
func canReachTarget(nums []int, target int) bool {
	// Your code here
	return false
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	return canReachTarget(JInts(a[0]), JInt(a[1]))
}`,
  },
  "cleaning-robot-coverage": {
    entry: "__call",
    starterCode: `// grid rows are made of '.' (open) and '#' (obstacle); start is
// []int{row, col} and is guaranteed open. The robot slides until blocked.
// Return []int{cleanableCells, restCells}.
func robotCoverage(grid []string, start []int) []int {
	// Your code here
	return []int{0, 0}
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	return robotCoverage(JStrs(a[0]), JInts(a[1]))
}`,
  },
  "warehouse-boxes": {
    entry: "__call",
    starterCode: `// heights are the room ceilings with the entrance at index 0; boxes are
// the box heights, insertable in any order.
// Return the maximum number of boxes that can be stored.
func maxBoxes(heights []int, boxes []int) int {
	// Your code here
	return 0
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	return maxBoxes(JInts(a[0]), JInts(a[1]))
}`,
  },
  "mark-and-compact-subtree": {
    entry: "__call",
    starterCode: `// CompactResult is what markAndCompact returns: the compacted array plus
// the old index -> new index map for every survivor.
type CompactResult struct {
	NewArray []string
	Remap    map[int]int
}

// heapArray is an implicit binary tree (children of i at 2i+1 and 2i+2)
// where "" is an empty slot (JSON null) with no subtree below it.
// Collect the subtree rooted at k, compact the survivors to the front
// preserving their order, and report where each survivor moved.
func markAndCompact(heapArray []string, k int) CompactResult {
	// Your code here
	return CompactResult{NewArray: []string{}, Remap: map[int]int{}}
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	heapArray := JStrs(a[0])
	result := markAndCompact(append([]string{}, heapArray...), JInt(a[1]))
	return map[string]interface{}{
		"newArray": result.NewArray,
		"remap":    result.Remap,
	}
}`,
  },
};
