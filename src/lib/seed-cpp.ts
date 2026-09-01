import type { JudgeLanguage } from "./types";

// C++ judge definitions, keyed by problem slug, merged into each problem's
// judge as judge.cpp by the seed script. Tests are shared across languages.
//
// The harness (cpp-harness.ts) compiles the user's code in and each driver
// implements `Json __call(const vector<Json>& a)`, unpacking the shared JSON
// payload into typed arguments. Targets C++14. Json helpers:
//   a[0].ints() / .strings() / .intGrid() / .intMap() / .stringListMap()
//   a[0].list() / .at(i) / .key("f") / .size()
//   a[1].asInt() / .asLong() / .str() / .boolean() / .num() / .isNull()
//   Json::of(x), Json::ofInts, Json::ofStrings, Json::ofList, Json::ofMap,
//   Json::ofIntGrid, Json::ofIntMap, Json::ofIndexMap, Json::ofNull()
// Null strings arrive as "". The whole standard library is included and
// `using namespace std;` is in effect.

export const cppJudges: Record<string, JudgeLanguage> = {
  "pair-sum-sorted": {
    entry: "__call",
    starterCode: `vector<int> pairSum(vector<int> numbers, int target) {
    // numbers is sorted ascending. Return {i, j} with i < j, or {-1, -1}.
    return vector<int>{-1, -1};
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    return Json::ofInts(pairSum(a[0].ints(), a[1].asInt()));
}`,
  },
  "merge-intervals": {
    entry: "__call",
    starterCode: `vector<vector<int> > mergeIntervals(vector<vector<int> > intervals) {
    // intervals are {start, end} pairs in any order.
    // Return the merged intervals sorted by start.
    return intervals;
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    return Json::ofIntGrid(mergeIntervals(a[0].intGrid()));
}`,
  },
  "lru-cache": {
    entry: "__call",
    starterCode: `class LRUCache {
public:
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
};
`,
    driverCode: `Json __call(const vector<Json>& a) {
    const vector<Json>& ops = a[0].list();
    const vector<Json>& args = a[1].list();
    LRUCache* instance = 0;
    vector<Json> out;
    for (size_t i = 0; i < ops.size(); i++) {
        const string& op = ops[i].str();
        const vector<Json>& x = args[i].list();
        if (op == "LRUCache") {
            instance = new LRUCache(x[0].asInt());
            out.push_back(Json::ofNull());
        } else if (op == "get") {
            out.push_back(Json::of(instance->get(x[0].asInt())));
        } else {
            instance->put(x[0].asInt(), x[1].asInt());
            out.push_back(Json::ofNull());
        }
    }
    delete instance;
    return Json::ofList(out);
}`,
  },
  "course-schedule": {
    entry: "__call",
    starterCode: `bool canFinish(int numCourses, vector<vector<int> > prerequisites) {
    // A prerequisite {a, b} means b must come before a.
    // Return true if all courses can be finished.
    return true;
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    return Json::of(canFinish(a[0].asInt(), a[1].intGrid()));
}`,
  },
  "max-width": {
    entry: "__call",
    starterCode: `vector<string> justify(vector<string> words, int maxWidth) {
    // Return the justified lines, each exactly maxWidth characters.
    return vector<string>();
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    return Json::ofStrings(justify(a[0].strings(), a[1].asInt()));
}`,
  },
  "round-numeric-strings": {
    entry: "__call",
    starterCode: `string roundNumericString(const string& s) {
    // Part 1: round one numeric string to the nearest integer, rounding
    // half away from zero. No leading zeros in the result, and never "-0".
    // Values can exceed any built-in numeric type - stay in string land.
    return s;
}

string roundAll(const string& csv) {
    // Part 2: round every value in a comma-separated list.
    return csv;
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    const string& kind = a[0].str();
    const string& value = a[1].str();
    return Json::of(kind == "csv" ? roundAll(value) : roundNumericString(value));
}`,
  },
  "violation-log-analyzer": {
    entry: "__call",
    starterCode: `class ViolationLog {
public:
    ViolationLog() {
        // Your state here
    }

    void record(int timestamp, const string& userId, const string& violationType) {
        // timestamps are non-decreasing across calls
    }

    int countRecent(const string& userId, int window) {
        // Violations by userId in (latest - window, latest].
        return 0;
    }

    vector<pair<string, int> > topK(int k) {
        // Top-k users by all-time count, ties lexicographic ->
        // {{user, count}, ...}
        return vector<pair<string, int> >();
    }

    bool shouldBan(const string& userId, int maxViolations, int window) {
        // True if userId ever had >= maxViolations in any window-second span.
        return false;
    }
};
`,
    driverCode: `Json __call(const vector<Json>& a) {
    const vector<Json>& ops = a[0].list();
    const vector<Json>& args = a[1].list();
    ViolationLog* log = 0;
    vector<Json> out;
    for (size_t i = 0; i < ops.size(); i++) {
        const string& op = ops[i].str();
        const vector<Json>& x = args[i].list();
        if (op == "ViolationLog") {
            log = new ViolationLog();
            out.push_back(Json::ofNull());
        } else if (op == "record") {
            log->record(x[0].asInt(), x[1].str(), x[2].str());
            out.push_back(Json::ofNull());
        } else if (op == "countRecent") {
            out.push_back(Json::of(log->countRecent(x[0].str(), x[1].asInt())));
        } else if (op == "topK") {
            vector<pair<string, int> > top = log->topK(x[0].asInt());
            vector<Json> rows;
            for (size_t j = 0; j < top.size(); j++) {
                vector<Json> row;
                row.push_back(Json::of(top[j].first));
                row.push_back(Json::of(top[j].second));
                rows.push_back(Json::ofList(row));
            }
            out.push_back(Json::ofList(rows));
        } else {
            out.push_back(
                Json::of(log->shouldBan(x[0].str(), x[1].asInt(), x[2].asInt())));
        }
    }
    delete log;
    return Json::ofList(out);
}`,
  },
  "nested-set-equality": {
    entry: "__call",
    starterCode: `bool nestedSetEqual(const Json& a, const Json& b) {
    // C++ has no natural variant type, so the nested sets arrive as raw
    // Json values: v.isArr() tells a set from an integer, v.list() walks
    // a set's children, and v.asInt() reads an integer leaf.
    // Return true when a and b are equal as sets, at every depth.
    return false;
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    return Json::of(nestedSetEqual(a[0], a[1]));
}`,
  },
  "assign-pins-shortest-columns": {
    entry: "__call",
    starterCode: `vector<int> assignPins(vector<int> heights, int k) {
    // Return the column index assigned to each pin, in order.
    return vector<int>();
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    return Json::ofInts(assignPins(a[0].ints(), a[1].asInt()));
}`,
  },
  "collect-reachable-pins": {
    entry: "__call",
    starterCode: `vector<string> collectReachablePins(
    const map<string, vector<string> >& boards, const string& start) {
    // boards: board id -> the pin ids on that board.
    // Return every reachable pin id SORTED; {} if start is unknown.
    return vector<string>();
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    return Json::ofStrings(collectReachablePins(a[0].stringListMap(), a[1].str()));
}`,
  },
  "stream-line-reader": {
    entry: "__call",
    starterCode: `class LineReader {
public:
    LineReader(function<string()> readChunk) {
        // readChunk() returns the next chunk, or "" once the stream ends.
        // Your state here
    }

    bool readLine(string& line) {
        // Writes the next complete line WITHOUT the newline into line and
        // returns true, the way getline does; returns false once the stream
        // is exhausted. Call readChunk lazily.
        return false;
    }
};

int settleFromStream(function<string()> readChunk) {
    // Part 2: lines are "payer,payee,amount" (integer amounts).
    // Return the minimum number of transactions to settle all balances
    // (use your LineReader).
    return 0;
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    const string& kind = a[0].str();
    vector<string> chunks = a[1].strings();
    int cap = a[2].asInt();
    size_t next = 0;
    function<string()> readChunk = [&next, &chunks]() -> string {
        return next < chunks.size() ? chunks[next++] : string();
    };
    if (kind == "settle") return Json::of(settleFromStream(readChunk));
    LineReader reader(readChunk);
    vector<Json> out;
    for (int n = 0; n < cap; n++) {
        string line;
        if (!reader.readLine(line)) {
            out.push_back(Json::ofNull());
            break;
        }
        out.push_back(Json::of(line));
    }
    return Json::ofList(out);
}`,
  },
  "escape-room-leaderboard": {
    entry: "__call",
    starterCode: `class EscapeRoomGame {
public:
    EscapeRoomGame(const vector<int>& playerIds, int maxRoom) {
        // Rooms run 0..maxRoom; playerIds fixes the room-0 tie order.
    }

    void advance(int playerId) {
        // Move the player forward one room; at the last room, a no-op. O(1).
    }

    int getRoom(int playerId) {
        // The player's current room. O(1).
        return -1;
    }

    vector<int> leaderboard(int k) {
        // Up to k ids: room desc, ties by earliest entry. O(N + k).
        return vector<int>();
    }
};
`,
    driverCode: `Json __call(const vector<Json>& a) {
    const vector<Json>& ops = a[0].list();
    const vector<Json>& args = a[1].list();
    EscapeRoomGame* game = 0;
    vector<Json> out;
    for (size_t i = 0; i < ops.size(); i++) {
        const string& op = ops[i].str();
        const vector<Json>& x = args[i].list();
        if (op == "EscapeRoomGame") {
            game = new EscapeRoomGame(x[0].ints(), x[1].asInt());
            out.push_back(Json::ofNull());
        } else if (op == "advance") {
            game->advance(x[0].asInt());
            out.push_back(Json::ofNull());
        } else if (op == "getRoom") {
            out.push_back(Json::of(game->getRoom(x[0].asInt())));
        } else {
            out.push_back(Json::ofInts(game->leaderboard(x[0].asInt())));
        }
    }
    delete game;
    return Json::ofList(out);
}`,
  },
  "rebalance-experiment-buckets": {
    entry: "__call",
    starterCode: `vector<string> rebalanceBuckets(vector<string> current,
                               map<string, int> targets) {
    // current: the group name holding each bucket, "" for unassigned
    // (that is the JSON null). targets: group name -> desired count.
    // Return a new assignment meeting targets exactly while changing as
    // few buckets as possible, again using "" for unassigned.
    return current;
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    vector<string> current = a[0].strings();
    map<string, int> targets = a[1].intMap();
    vector<string> result = rebalanceBuckets(current, targets);
    vector<pair<string, Json> > out;
    if (result.size() != current.size()) {
        out.push_back(make_pair("validShape", Json::of(false)));
        return Json::ofMap(out);
    }
    map<string, int> counts;
    for (size_t i = 0; i < result.size(); i++)
        if (!result[i].empty()) counts[result[i]]++;
    bool targetsMet = true;
    for (map<string, int>::const_iterator it = targets.begin();
         it != targets.end(); ++it) {
        map<string, int>::const_iterator c = counts.find(it->first);
        if ((c == counts.end() ? 0 : c->second) != it->second) targetsMet = false;
    }
    for (map<string, int>::const_iterator it = counts.begin();
         it != counts.end(); ++it)
        if (targets.find(it->first) == targets.end()) targetsMet = false;
    int changes = 0;
    for (size_t i = 0; i < current.size(); i++)
        if (current[i] != result[i]) changes++;
    out.push_back(make_pair("targetsMet", Json::of(targetsMet)));
    out.push_back(make_pair("changes", Json::of(changes)));
    return Json::ofMap(out);
}`,
  },
  "list-unallocated-buckets": {
    entry: "__call",
    starterCode: `vector<vector<int> > unallocatedRanges(int n,
                                      vector<vector<int> > allocated) {
    // allocated: inclusive {start, end} ranges, any order, possibly
    // overlapping or partly out of bounds (clamp them).
    // Return the minimal sorted list of free inclusive ranges.
    return vector<vector<int> >();
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    return Json::ofIntGrid(unallocatedRanges(a[0].asInt(), a[1].intGrid()));
}`,
  },
  "adjustable-id-allocator": {
    entry: "__call",
    starterCode: `class IDAllocator {
public:
    IDAllocator(int capacity) {
        // IDs live in [0, capacity).
        // Your state here
    }

    int allocate() {
        // Smallest available ID, or -1 if none.
        return -1;
    }

    bool release(int id) {
        // True only if id was currently allocated.
        return false;
    }

    void setCapacity(int c) {
        // Adjust capacity up or down; already-issued IDs stay valid.
    }
};
`,
    driverCode: `Json __call(const vector<Json>& a) {
    const vector<Json>& ops = a[0].list();
    const vector<Json>& args = a[1].list();
    IDAllocator* alloc = 0;
    vector<Json> out;
    for (size_t i = 0; i < ops.size(); i++) {
        const string& op = ops[i].str();
        const vector<Json>& x = args[i].list();
        if (op == "IDAllocator") {
            alloc = new IDAllocator(x[0].asInt());
            out.push_back(Json::ofNull());
        } else if (op == "allocate") {
            out.push_back(Json::of(alloc->allocate()));
        } else if (op == "release") {
            out.push_back(Json::of(alloc->release(x[0].asInt())));
        } else {
            alloc->setCapacity(x[0].asInt());
            out.push_back(Json::ofNull());
        }
    }
    delete alloc;
    return Json::ofList(out);
}`,
  },
  "design-adjustable-id-allocator": {
    entry: "__call",
    starterCode: `// A named contiguous ID range; start and end are -1 for a zero-size bucket.
struct Bucket {
    string name;
    int start;
    int end;
};

// Pack (name, size) requests from ID 0 into [0, 999], preserving order. A
// zero-size bucket packs as {name, -1, -1} and doesn't advance the cursor.
// Throw on a negative size or when the sizes sum past 1000.
vector<Bucket> packBuckets(const vector<string>& names,
                           const vector<int>& sizes) {
    // Your code here
    return vector<Bucket>();
}

// Resize one bucket of a packed layout to exactly newSize IDs; the target
// keeps its start and later buckets shift by the delta. Must NOT mutate
// buckets when the resize is rejected. Throw on an unknown name, a negative
// size, or an overfull layout.
vector<Bucket> resizeBuckets(vector<Bucket>& buckets, const string& name,
                             int newSize) {
    // Your code here
    return buckets;
}
`,
    driverCode: `static Json __layout(const vector<Bucket>& layout) {
    vector<Json> out;
    for (size_t i = 0; i < layout.size(); i++) {
        vector<Json> row;
        row.push_back(Json::of(layout[i].name));
        row.push_back(Json::of(layout[i].start));
        row.push_back(Json::of(layout[i].end));
        out.push_back(Json::ofList(row));
    }
    return Json::ofList(out);
}

Json __call(const vector<Json>& a) {
    const string& op = a[0].str();
    const vector<Json>& rows = a[1].list();
    if (op == "pack") {
        vector<string> names;
        vector<int> sizes;
        for (size_t i = 0; i < rows.size(); i++) {
            const vector<Json>& row = rows[i].list();
            names.push_back(row[0].str());
            sizes.push_back(row[1].asInt());
        }
        try {
            return __layout(packBuckets(names, sizes));
        } catch (...) {
            return Json::of(string("threw"));
        }
    }
    vector<Bucket> buckets;
    for (size_t i = 0; i < rows.size(); i++) {
        const vector<Json>& row = rows[i].list();
        Bucket b;
        b.name = row[0].str();
        b.start = row[1].asInt();
        b.end = row[2].asInt();
        buckets.push_back(b);
    }
    try {
        return __layout(resizeBuckets(buckets, a[2].str(), a[3].asInt()));
    } catch (...) {
        for (size_t i = 0; i < rows.size(); i++) {
            const vector<Json>& row = rows[i].list();
            if (buckets[i].name != row[0].str() ||
                buckets[i].start != row[1].asInt() ||
                buckets[i].end != row[2].asInt()) {
                return Json::of(string("threw but mutated its input"));
            }
        }
        return Json::of(string("threw"));
    }
}`,
  },
  "flag-spam-numbers": {
    entry: "__call",
    starterCode: `vector<string> flagSpamNumbers(vector<vector<string> > callLog,
                              vector<vector<string> > reports,
                              int minReports) {
    // callLog: {caller, callee} pairs. reports: {reporter, number} pairs.
    // Flag numbers with >= minReports distinct valid reporters; return
    // them sorted.
    return vector<string>();
}
`,
    driverCode: `static vector<vector<string> > __stringGrid(const Json& v) {
    vector<vector<string> > out;
    for (size_t i = 0; i < v.size(); i++) out.push_back(v.at(i).strings());
    return out;
}

Json __call(const vector<Json>& a) {
    return Json::ofStrings(
        flagSpamNumbers(__stringGrid(a[0]), __stringGrid(a[1]), a[2].asInt()));
}`,
  },
  "sparse-matrix-operations": {
    entry: "__call",
    starterCode: `class SparseMatrix {
public:
    int nRows;
    int nCols;
    // Your storage here

    SparseMatrix(int rows, int cols) : nRows(rows), nCols(cols) {}

    static SparseMatrix fromDense(const vector<vector<int> >& dense) {
        // Your code here
        return SparseMatrix((int) dense.size(),
                            dense.empty() ? 0 : (int) dense[0].size());
    }

    int get(int r, int c) const {
        return 0;
    }

    void set(int r, int c, int v) {
        // Storing 0 must remove the entry.
    }

    SparseMatrix add(const SparseMatrix& other) const {
        // Throw on dimension mismatch, e.g. throw runtime_error("mismatch").
        return *this;
    }

    SparseMatrix multiply(const SparseMatrix& other) const {
        // Throw on dimension mismatch.
        return *this;
    }

    vector<vector<int> > toDense() const {
        return vector<vector<int> >();
    }

    int nnz() const {
        // Count of stored nonzero entries.
        return 0;
    }
};
`,
    driverCode: `Json __call(const vector<Json>& a) {
    const string& op = a[0].str();
    SparseMatrix m = SparseMatrix::fromDense(a[1].intGrid());
    const vector<Json>& extra = a[3].list();
    vector<pair<string, Json> > out;
    if (op == "get") return Json::of(m.get(extra[0].asInt(), extra[1].asInt()));
    if (op == "set") {
        m.set(extra[0].asInt(), extra[1].asInt(), extra[2].asInt());
        out.push_back(make_pair("dense", Json::ofIntGrid(m.toDense())));
        out.push_back(make_pair("nnz", Json::of(m.nnz())));
        return Json::ofMap(out);
    }
    SparseMatrix other = SparseMatrix::fromDense(a[2].intGrid());
    try {
        SparseMatrix result = op == "add" ? m.add(other) : m.multiply(other);
        out.push_back(make_pair("dense", Json::ofIntGrid(result.toDense())));
        out.push_back(make_pair("nnz", Json::of(result.nnz())));
    } catch (...) {
        return Json::of(string("error"));
    }
    return Json::ofMap(out);
}`,
  },
  "nearest-eligible-elevator": {
    entry: "__call",
    starterCode: `struct Elevator {
    int id;
    int floor;
    string direction;      // "up" | "down" | "idle"
    vector<int> serviced;  // the floors this elevator stops at
};

int selectElevator(const vector<Elevator>& elevators, int floor,
                   const string& direction) {
    // Return the nearest eligible elevator's id (ties -> lowest id), or -1.
    return -1;
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    const vector<Json>& raw = a[0].list();
    vector<Elevator> elevators;
    for (size_t i = 0; i < raw.size(); i++) {
        Elevator e;
        e.id = raw[i].key("id").asInt();
        e.floor = raw[i].key("floor").asInt();
        e.direction = raw[i].key("direction").str();
        e.serviced = raw[i].key("serviced").ints();
        elevators.push_back(e);
    }
    return Json::of(selectElevator(elevators, a[1].asInt(), a[2].str()));
}`,
  },
  "subsequence-expression-target": {
    entry: "__call",
    starterCode: `bool canReachTarget(vector<int> nums, int target) {
    // Can some subsequence with + and * (standard precedence) evaluate
    // exactly to target?
    return false;
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    return Json::of(canReachTarget(a[0].ints(), a[1].asInt()));
}`,
  },
  "cleaning-robot-coverage": {
    entry: "__call",
    starterCode: `vector<int> robotCoverage(vector<string> grid, vector<int> start) {
    // grid: rows of '.' and '#'. start: {row, col}, guaranteed open.
    // The robot slides until blocked. Return {cleanableCells, restCells}.
    return vector<int>{0, 0};
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    return Json::ofInts(robotCoverage(a[0].strings(), a[1].ints()));
}`,
  },
  "warehouse-boxes": {
    entry: "__call",
    starterCode: `int maxBoxes(vector<int> heights, vector<int> boxes) {
    // heights: room ceilings, entrance at index 0. boxes: box heights.
    // Return the maximum number of boxes that can be stored.
    return 0;
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    return Json::of(maxBoxes(a[0].ints(), a[1].ints()));
}`,
  },
  "mark-and-compact-subtree": {
    entry: "__call",
    starterCode: `struct CompactResult {
    vector<string> newArray;
    map<int, int> remap;  // old index -> new index, for every survivor
};

CompactResult markAndCompact(vector<string> heapArray, int k) {
    // heapArray is an implicit binary tree (children of i at 2i+1 and
    // 2i+2), where "" marks an empty slot - the JSON null - meaning no
    // node and no subtree below it. Collect the subtree rooted at k,
    // compact the survivors to the front preserving their order, and
    // report where each survivor moved.
    return CompactResult();
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    CompactResult r = markAndCompact(a[0].strings(), a[1].asInt());
    vector<pair<string, Json> > out;
    out.push_back(make_pair("newArray", Json::ofStrings(r.newArray)));
    out.push_back(make_pair("remap", Json::ofIndexMap(r.remap)));
    return Json::ofMap(out);
}`,
  },
  "single-tab-browser-history": {
    entry: "__call",
    starterCode: `class BrowserSession {
public:
    BrowserSession(const string& homepage) {
        // Your state here
    }

    void visit(const string& url) {
        // Navigate to url, clearing forward history.
    }

    string back(int steps) {
        // Move up to steps pages back; return the current url.
        return "";
    }

    string forward(int steps) {
        // Move up to steps pages forward; return the current url.
        return "";
    }

    bool haveVisited(const string& url) {
        // Has url ever been visited?
        return false;
    }
};
`,
    driverCode: `Json __call(const vector<Json>& a) {
    const vector<Json>& ops = a[0].list();
    const vector<Json>& args = a[1].list();
    BrowserSession* s = 0;
    vector<Json> out;
    for (size_t i = 0; i < ops.size(); i++) {
        const string& op = ops[i].str();
        const vector<Json>& x = args[i].list();
        if (op == "BrowserSession") {
            s = new BrowserSession(x[0].str());
            out.push_back(Json::ofNull());
        } else if (op == "visit") {
            s->visit(x[0].str());
            out.push_back(Json::ofNull());
        } else if (op == "back") {
            out.push_back(Json::of(s->back(x[0].asInt())));
        } else if (op == "forward") {
            out.push_back(Json::of(s->forward(x[0].asInt())));
        } else {
            out.push_back(Json::of(s->haveVisited(x[0].str())));
        }
    }
    delete s;
    return Json::ofList(out);
}`,
  },
};
