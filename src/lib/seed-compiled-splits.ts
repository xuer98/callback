import type { JudgeLanguage } from "./types";

// Java, C++ and Go judges for problems split out of multi-question prompts,
// keyed by slug and merged into judge.java / judge.cpp / judge.go by the seed
// script. Drivers follow the same conventions as seed-java.ts, seed-cpp.ts
// and seed-go.ts.

export const javaSplitJudges: Record<string, JudgeLanguage> = {
  "round-numeric-string-list": {
    entry: "__call",
    starterCode: `class Solution {
    String roundAll(String csv) {
        // Round every value in a comma-separated list of numeric strings to
        // the nearest integer, rounding half away from zero. No leading
        // zeros, never "-0". Values can exceed any built-in numeric type -
        // stay in string land.
        return csv;
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        return Json.of(new Solution().roundAll(a.get(0).str()));
    }`,
  },
  "settle-debts-from-stream": {
    entry: "__call",
    starterCode: `class Solution {
    int settleFromStream(Supplier<String> readChunk) {
        // readChunk.get() returns the next chunk, or "" once the stream ends.
        // Lines are "payer,payee,amount" (integer amounts) and may be split
        // across chunks. Return the minimum number of transactions to settle
        // all balances.
        return 0;
    }
}
`,
    driverCode: `    static Json __call(List<Json> a) {
        final List<String> chunks = a.get(0).stringList();
        final int[] at = new int[] {0};
        Supplier<String> readChunk = new Supplier<String>() {
            public String get() {
                return at[0] < chunks.size() ? chunks.get(at[0]++) : "";
            }
        };
        return Json.of(new Solution().settleFromStream(readChunk));
    }`,
  },
};

export const cppSplitJudges: Record<string, JudgeLanguage> = {
  "round-numeric-string-list": {
    entry: "__call",
    starterCode: `string roundAll(const string& csv) {
    // Round every value in a comma-separated list of numeric strings to the
    // nearest integer, rounding half away from zero. No leading zeros, never
    // "-0". Values can exceed any built-in numeric type - stay in string land.
    return csv;
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    return Json::of(roundAll(a[0].str()));
}`,
  },
  "settle-debts-from-stream": {
    entry: "__call",
    starterCode: `int settleFromStream(function<string()> readChunk) {
    // readChunk() returns the next chunk, or "" once the stream ends.
    // Lines are "payer,payee,amount" (integer amounts) and may be split
    // across chunks. Return the minimum number of transactions to settle
    // all balances.
    return 0;
}
`,
    driverCode: `Json __call(const vector<Json>& a) {
    vector<string> chunks = a[0].strings();
    size_t next = 0;
    function<string()> readChunk = [&next, &chunks]() -> string {
        return next < chunks.size() ? chunks[next++] : string();
    };
    return Json::of(settleFromStream(readChunk));
}`,
  },
};

export const goSplitJudges: Record<string, JudgeLanguage> = {
  "round-numeric-string-list": {
    entry: "__call",
    starterCode: `// Round every value in a comma-separated list of numeric strings to the
// nearest integer, rounding half away from zero. No leading zeros, never
// "-0". Values can exceed any built-in numeric type - stay in string land.
func roundAll(csv string) string {
	// Your code here
	return csv
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	return roundAll(JStr(a[0]))
}`,
  },
  "settle-debts-from-stream": {
    entry: "__call",
    starterCode: `// readChunk returns the next chunk, or the empty string once the stream
// ends. Lines are "payer,payee,amount" (integer amounts) and may be split
// across chunks. Return the minimum number of transactions to settle all
// balances.
func settleFromStream(readChunk func() string) int {
	// Your code here
	return 0
}
`,
    driverCode: `func __call(a []interface{}) interface{} {
	chunks := JStrs(a[0])
	next := 0
	readChunk := func() string {
		if next >= len(chunks) {
			return ""
		}
		next++
		return chunks[next-1]
	}
	return settleFromStream(readChunk)
}`,
  },
};
