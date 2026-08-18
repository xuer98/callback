import type { JudgeLanguage } from "./types";

// Java judge definitions, keyed by problem slug, merged into each problem's
// judge as judge.java by the seed script. Tests are shared across languages.
//
// Java can't eval source, so the harness (java-harness.ts) compiles the
// user's code in and each driver implements `Json __call(List<Json> a)`,
// unpacking the shared JSON payload into typed arguments. Json helpers:
//   a.get(0).ints() / .strings() / .intGrid() / .intList() / .stringList()
//   a.get(0).intMap() / .stringListMap() / .list() / .key("f") / .at(i)
//   a.get(1).asInt() / .asLong() / .str() / .bool() / .num() / .isNull()
//   Json.of(x), Json.ofInts, Json.ofStrings, Json.ofList, Json.ofMap,
//   Json.ofIntGrid, Json.ofIntList, Json.ofStringList, Json.ofIntMap,
//   Json.ofIndexMap, Json.NULL
// Method-based problems put their solution in `class Solution`; class-based
// problems declare the class the prompt names. Where a problem's shape has
// no natural Java type (a pair, a record, a variant), the starter declares a
// small named class alongside so the signature stays readable.

export const javaJudges: Record<string, JudgeLanguage> = {
  "pair-sum-sorted": {
    entry: "__call",
    starterCode: `class Solution {
    int[] pairSum(int[] numbers, int target) {
        // numbers is sorted ascending. Return {i, j} with i < j, or {-1, -1}.
        return new int[] {-1, -1};
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        return Json.ofInts(new Solution().pairSum(a.get(0).ints(), a.get(1).asInt()));
    }`,
  },
  "merge-intervals": {
    entry: "__call",
    starterCode: `class Solution {
    int[][] mergeIntervals(int[][] intervals) {
        // intervals are {start, end} pairs in any order.
        // Return the merged intervals sorted by start.
        return intervals;
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        return Json.ofIntGrid(new Solution().mergeIntervals(a.get(0).intGrid()));
    }`,
  },
  "lru-cache": {
    entry: "__call",
    starterCode: `class LRUCache {
    LRUCache(int capacity) {
        // Your state here
    }

    int get(int key) {
        // Return the value, or -1 if absent.
        return -1;
    }

    void put(int key, int value) {
        // Your code here
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        List<Json> ops = a.get(0).list();
        List<Json> args = a.get(1).list();
        LRUCache instance = null;
        List<Json> out = new ArrayList<Json>();
        for (int i = 0; i < ops.size(); i++) {
            String op = ops.get(i).str();
            List<Json> x = args.get(i).list();
            if (op.equals("LRUCache")) {
                instance = new LRUCache(x.get(0).asInt());
                out.add(Json.NULL);
            } else if (op.equals("get")) {
                out.add(Json.of(instance.get(x.get(0).asInt())));
            } else {
                instance.put(x.get(0).asInt(), x.get(1).asInt());
                out.add(Json.NULL);
            }
        }
        return Json.ofList(out);
    }`,
  },
  "course-schedule": {
    entry: "__call",
    starterCode: `class Solution {
    boolean canFinish(int numCourses, int[][] prerequisites) {
        // A prerequisite {a, b} means b must come before a.
        // Return true if all courses can be finished.
        return true;
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        return Json.of(new Solution().canFinish(a.get(0).asInt(), a.get(1).intGrid()));
    }`,
  },
  "max-width": {
    entry: "__call",
    starterCode: `class Solution {
    List<String> justify(String[] words, int maxWidth) {
        // Return the justified lines, each exactly maxWidth characters.
        return new ArrayList<String>();
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        return Json.ofStringList(new Solution().justify(a.get(0).strings(), a.get(1).asInt()));
    }`,
  },
  "round-numeric-strings": {
    entry: "__call",
    starterCode: `class Solution {
    String roundNumericString(String s) {
        // Part 1: round one numeric string to the nearest integer, rounding
        // half away from zero. No leading zeros in the result, and never "-0".
        // Values can exceed any built-in numeric type - stay in string land.
        return s;
    }

    String roundAll(String csv) {
        // Part 2: round every value in a comma-separated list.
        return csv;
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        Solution s = new Solution();
        String value = a.get(1).str();
        return Json.of(a.get(0).str().equals("csv") ? s.roundAll(value) : s.roundNumericString(value));
    }`,
  },
  "violation-log-analyzer": {
    entry: "__call",
    starterCode: `/** One row of topK: a user and their all-time violation count. */
class UserCount {
    final String user;
    final int count;

    UserCount(String user, int count) {
        this.user = user;
        this.count = count;
    }
}

class ViolationLog {
    ViolationLog() {
        // Your state here
    }

    void record(int timestamp, String userId, String violationType) {
        // timestamps are non-decreasing across calls
    }

    int countRecent(String userId, int window) {
        // Violations by userId in (latest - window, latest].
        return 0;
    }

    List<UserCount> topK(int k) {
        // Top-k users by all-time count, ties lexicographic.
        return new ArrayList<UserCount>();
    }

    boolean shouldBan(String userId, int maxViolations, int window) {
        // True if userId ever had >= maxViolations in any window-second span.
        return false;
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        List<Json> ops = a.get(0).list();
        List<Json> args = a.get(1).list();
        ViolationLog log = null;
        List<Json> out = new ArrayList<Json>();
        for (int i = 0; i < ops.size(); i++) {
            String op = ops.get(i).str();
            List<Json> x = args.get(i).list();
            if (op.equals("ViolationLog")) {
                log = new ViolationLog();
                out.add(Json.NULL);
            } else if (op.equals("record")) {
                log.record(x.get(0).asInt(), x.get(1).str(), x.get(2).str());
                out.add(Json.NULL);
            } else if (op.equals("countRecent")) {
                out.add(Json.of(log.countRecent(x.get(0).str(), x.get(1).asInt())));
            } else if (op.equals("topK")) {
                List<Json> rows = new ArrayList<Json>();
                for (UserCount uc : log.topK(x.get(0).asInt())) {
                    List<Json> pair = new ArrayList<Json>();
                    pair.add(Json.of(uc.user));
                    pair.add(Json.of(uc.count));
                    rows.add(Json.ofList(pair));
                }
                out.add(Json.ofList(rows));
            } else {
                out.add(Json.of(log.shouldBan(x.get(0).str(), x.get(1).asInt(), x.get(2).asInt())));
            }
        }
        return Json.ofList(out);
    }`,
  },
  "nested-set-equality": {
    entry: "__call",
    starterCode: `class Solution {
    boolean nestedSetEqual(Json a, Json b) {
        // Nested sets are (possibly nested) lists of integers, so they arrive
        // as the harness's Json values - Java has no natural variant type.
        // Use a.isArr() to test whether a node is a nested set, a.list() to
        // walk its children, and a.asInt() to read an integer leaf.
        // Return true when a and b are equal as sets, at every depth.
        return false;
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        return Json.of(new Solution().nestedSetEqual(a.get(0), a.get(1)));
    }`,
  },
  "assign-pins-shortest-columns": {
    entry: "__call",
    starterCode: `class Solution {
    int[] assignPins(int[] heights, int k) {
        // Return the column index assigned to each pin, in order.
        return new int[0];
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        return Json.ofInts(new Solution().assignPins(a.get(0).ints(), a.get(1).asInt()));
    }`,
  },
  "collect-reachable-pins": {
    entry: "__call",
    starterCode: `class Solution {
    List<String> collectReachablePins(Map<String, List<String>> boards, String start) {
        // boards: board id -> the pin ids on that board.
        // Return every reachable pin id SORTED; empty if start is unknown.
        return new ArrayList<String>();
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        return Json.ofStringList(
            new Solution().collectReachablePins(a.get(0).stringListMap(), a.get(1).str()));
    }`,
  },
  "stream-line-reader": {
    entry: "__call",
    starterCode: `class LineReader {
    LineReader(Supplier<String> readChunk) {
        // readChunk.get() returns the next chunk, or "" once the stream ends.
        // Your state here
    }

    String readLine() {
        // Next complete line without the newline; null once exhausted.
        // Call readChunk.get() lazily.
        return null;
    }
}

class Solution {
    int settleFromStream(Supplier<String> readChunk) {
        // Part 2: lines are "payer,payee,amount" (integer amounts).
        // Return the minimum number of transactions to settle all balances
        // (use your LineReader).
        return 0;
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        final List<String> chunks = a.get(1).stringList();
        final int[] at = new int[] {0};
        Supplier<String> readChunk = new Supplier<String>() {
            public String get() {
                return at[0] < chunks.size() ? chunks.get(at[0]++) : "";
            }
        };
        if (a.get(0).str().equals("settle")) {
            return Json.of(new Solution().settleFromStream(readChunk));
        }
        int cap = a.get(2).asInt();
        LineReader reader = new LineReader(readChunk);
        List<Json> out = new ArrayList<Json>();
        for (int n = 0; n < cap; n++) {
            String line = reader.readLine();
            out.add(line == null ? Json.NULL : Json.of(line));
            if (line == null) break;
        }
        return Json.ofList(out);
    }`,
  },
  "escape-room-leaderboard": {
    entry: "__call",
    starterCode: `class Leaderboard {
    Leaderboard() {
        // Your state here
    }

    void addResult(String team, int time) {
        // Record an attempt; only improvements change the standings.
    }

    int rank(String team) {
        // 1-indexed rank by best time (ties alphabetical), or -1.
        return -1;
    }

    List<String> topK(int k) {
        // The k best team names, in rank order.
        return new ArrayList<String>();
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        List<Json> ops = a.get(0).list();
        List<Json> args = a.get(1).list();
        Leaderboard lb = null;
        List<Json> out = new ArrayList<Json>();
        for (int i = 0; i < ops.size(); i++) {
            String op = ops.get(i).str();
            List<Json> x = args.get(i).list();
            if (op.equals("Leaderboard")) {
                lb = new Leaderboard();
                out.add(Json.NULL);
            } else if (op.equals("addResult")) {
                lb.addResult(x.get(0).str(), x.get(1).asInt());
                out.add(Json.NULL);
            } else if (op.equals("rank")) {
                out.add(Json.of(lb.rank(x.get(0).str())));
            } else {
                out.add(Json.ofStringList(lb.topK(x.get(0).asInt())));
            }
        }
        return Json.ofList(out);
    }`,
  },
  "rebalance-experiment-buckets": {
    entry: "__call",
    starterCode: `class Solution {
    String[] rebalanceBuckets(String[] current, Map<String, Integer> targets) {
        // current: per-bucket group name, with null for an unassigned bucket.
        // targets: group -> desired bucket count.
        // Return a new assignment meeting targets exactly while changing as
        // few buckets as possible.
        return current;
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        String[] current = a.get(0).strings();
        Map<String, Integer> targets = a.get(1).intMap();
        String[] result = new Solution().rebalanceBuckets(
            current.clone(), new LinkedHashMap<String, Integer>(targets));
        LinkedHashMap<String, Json> verdict = new LinkedHashMap<String, Json>();
        if (result == null || result.length != current.length) {
            verdict.put("validShape", Json.of(false));
            return Json.ofMap(verdict);
        }
        Map<String, Integer> counts = new LinkedHashMap<String, Integer>();
        for (String g : result) {
            if (g != null) counts.put(g, counts.containsKey(g) ? counts.get(g) + 1 : 1);
        }
        boolean targetsMet = true;
        for (Map.Entry<String, Integer> e : targets.entrySet()) {
            int have = counts.containsKey(e.getKey()) ? counts.get(e.getKey()).intValue() : 0;
            if (have != e.getValue().intValue()) targetsMet = false;
        }
        for (String g : counts.keySet()) {
            if (!targets.containsKey(g)) targetsMet = false;
        }
        int changes = 0;
        for (int i = 0; i < current.length; i++) {
            boolean same = current[i] == null ? result[i] == null : current[i].equals(result[i]);
            if (!same) changes++;
        }
        verdict.put("targetsMet", Json.of(targetsMet));
        verdict.put("changes", Json.of(changes));
        return Json.ofMap(verdict);
    }`,
  },
  "list-unallocated-buckets": {
    entry: "__call",
    starterCode: `class Solution {
    int[][] unallocatedRanges(int n, int[][] allocated) {
        // The bucket space is [0, n). allocated holds inclusive {start, end}
        // ranges in any order, possibly overlapping or partly out of bounds
        // (clamp them). Return the minimal sorted list of free inclusive ranges.
        return new int[0][];
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        return Json.ofIntGrid(new Solution().unallocatedRanges(a.get(0).asInt(), a.get(1).intGrid()));
    }`,
  },
  "adjustable-id-allocator": {
    entry: "__call",
    starterCode: `class IDAllocator {
    IDAllocator(int capacity) {
        // IDs live in [0, capacity).
        // Your state here
    }

    int allocate() {
        // Smallest available ID, or -1 if none.
        return -1;
    }

    boolean release(int id) {
        // True only if id was currently allocated.
        return false;
    }

    void setCapacity(int c) {
        // Adjust capacity up or down; already-issued IDs stay valid.
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        List<Json> ops = a.get(0).list();
        List<Json> args = a.get(1).list();
        IDAllocator alloc = null;
        List<Json> out = new ArrayList<Json>();
        for (int i = 0; i < ops.size(); i++) {
            String op = ops.get(i).str();
            List<Json> x = args.get(i).list();
            if (op.equals("IDAllocator")) {
                alloc = new IDAllocator(x.get(0).asInt());
                out.add(Json.NULL);
            } else if (op.equals("allocate")) {
                out.add(Json.of(alloc.allocate()));
            } else if (op.equals("release")) {
                out.add(Json.of(alloc.release(x.get(0).asInt())));
            } else {
                alloc.setCapacity(x.get(0).asInt());
                out.add(Json.NULL);
            }
        }
        return Json.ofList(out);
    }`,
  },
  "flag-spam-numbers": {
    entry: "__call",
    starterCode: `class Solution {
    List<String> flagSpamNumbers(String[][] callLog, String[][] reports, int minReports) {
        // callLog: {caller, callee} pairs. reports: {reporter, number} pairs.
        // Flag numbers with >= minReports distinct valid reporters; return
        // them sorted.
        return new ArrayList<String>();
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        return Json.ofStringList(new Solution().flagSpamNumbers(
            __pairs(a.get(0)), __pairs(a.get(1)), a.get(2).asInt()));
    }

    static String[][] __pairs(Json j) {
        List<Json> rows = j.list();
        String[][] out = new String[rows.size()][];
        for (int i = 0; i < out.length; i++) out[i] = rows.get(i).strings();
        return out;
    }`,
  },
  "sparse-matrix-operations": {
    entry: "__call",
    starterCode: `class SparseMatrix {
    int nRows;
    int nCols;

    SparseMatrix(int nRows, int nCols) {
        this.nRows = nRows;
        this.nCols = nCols;
        // Your storage here
    }

    static SparseMatrix fromDense(int[][] dense) {
        // Your code here
        return new SparseMatrix(dense.length, dense.length == 0 ? 0 : dense[0].length);
    }

    int get(int r, int c) {
        return 0;
    }

    void set(int r, int c, int v) {
        // Storing 0 must remove the entry.
    }

    SparseMatrix add(SparseMatrix other) {
        // Throw on dimension mismatch.
        return this;
    }

    SparseMatrix multiply(SparseMatrix other) {
        // Throw on dimension mismatch.
        return this;
    }

    int[][] toDense() {
        return new int[0][];
    }

    int nnz() {
        // Count of stored nonzero entries.
        return 0;
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        String op = a.get(0).str();
        SparseMatrix m = SparseMatrix.fromDense(a.get(1).intGrid());
        int[] extra = a.get(3).ints();
        if (op.equals("get")) return Json.of(m.get(extra[0], extra[1]));
        if (op.equals("set")) {
            m.set(extra[0], extra[1], extra[2]);
            return __shape(m);
        }
        SparseMatrix other = SparseMatrix.fromDense(a.get(2).intGrid());
        SparseMatrix result;
        try {
            result = op.equals("add") ? m.add(other) : m.multiply(other);
        } catch (Exception e) {
            return Json.of("error");
        }
        return __shape(result);
    }

    static Json __shape(SparseMatrix m) {
        LinkedHashMap<String, Json> out = new LinkedHashMap<String, Json>();
        out.put("dense", Json.ofIntGrid(m.toDense()));
        out.put("nnz", Json.of(m.nnz()));
        return Json.ofMap(out);
    }`,
  },
  "nearest-eligible-elevator": {
    entry: "__call",
    starterCode: `/** One elevator in the building. */
class Elevator {
    final int id;
    final int floor;
    final String direction; // "up", "down", or "idle"
    final int[] serviced; // floors this elevator stops at

    Elevator(int id, int floor, String direction, int[] serviced) {
        this.id = id;
        this.floor = floor;
        this.direction = direction;
        this.serviced = serviced;
    }
}

class Solution {
    int selectElevator(List<Elevator> elevators, int floor, String direction) {
        // Return the nearest eligible elevator's id (ties -> lowest id), or -1.
        return -1;
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        List<Elevator> elevators = new ArrayList<Elevator>();
        for (Json e : a.get(0).list()) {
            elevators.add(new Elevator(e.key("id").asInt(), e.key("floor").asInt(),
                e.key("direction").str(), e.key("serviced").ints()));
        }
        return Json.of(new Solution().selectElevator(elevators, a.get(1).asInt(), a.get(2).str()));
    }`,
  },
  "subsequence-expression-target": {
    entry: "__call",
    starterCode: `class Solution {
    boolean canReachTarget(int[] nums, int target) {
        // Can some subsequence with + and * (standard precedence) evaluate
        // exactly to target?
        return false;
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        return Json.of(new Solution().canReachTarget(a.get(0).ints(), a.get(1).asInt()));
    }`,
  },
  "cleaning-robot-coverage": {
    entry: "__call",
    starterCode: `class Solution {
    int[] robotCoverage(String[] grid, int[] start) {
        // grid: rows of '.' and '#'. start: {row, col}, guaranteed open.
        // The robot slides until blocked. Return {cleanableCells, restCells}.
        return new int[] {0, 0};
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        return Json.ofInts(new Solution().robotCoverage(a.get(0).strings(), a.get(1).ints()));
    }`,
  },
  "warehouse-boxes": {
    entry: "__call",
    starterCode: `class Solution {
    int maxBoxes(int[] heights, int[] boxes) {
        // heights: room ceilings, entrance at index 0. boxes: box heights.
        // Return the maximum number of boxes that can be stored.
        return 0;
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        return Json.of(new Solution().maxBoxes(a.get(0).ints(), a.get(1).ints()));
    }`,
  },
  "mark-and-compact-subtree": {
    entry: "__call",
    starterCode: `/** What markAndCompact returns: the compacted array plus old -> new. */
class CompactResult {
    final String[] newArray;
    final Map<Integer, Integer> remap;

    CompactResult(String[] newArray, Map<Integer, Integer> remap) {
        this.newArray = newArray;
        this.remap = remap;
    }
}

class Solution {
    CompactResult markAndCompact(String[] heapArray, int k) {
        // heapArray is an implicit binary tree (children of i at 2i+1, 2i+2);
        // a null element means no node. Collect the subtree at k, compact the
        // survivors, and return the new array plus a remap of old index -> new.
        return new CompactResult(new String[0], new LinkedHashMap<Integer, Integer>());
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        CompactResult result = new Solution().markAndCompact(a.get(0).strings(), a.get(1).asInt());
        LinkedHashMap<String, Json> out = new LinkedHashMap<String, Json>();
        out.put("newArray", Json.ofStrings(result.newArray));
        out.put("remap", Json.ofIndexMap(result.remap));
        return Json.ofMap(out);
    }`,
  },
};
