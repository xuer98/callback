// C++ judging harness for the Judge0 sandbox — same shape as the Java one:
//
//   [prelude: Json + parser/serializer]  [user code]  [driver]  [main]
//
// Per-problem drivers implement `Json __call(const vector<Json>& a)`.
// Targets C++14 (Judge0 CE's g++ defaults to gnu++14), with explicit
// includes rather than <bits/stdc++.h> so it also builds under clang.
//
// Written with String.raw so backslashes stay literal in the emitted C++.

const CPP_PRELUDE = String.raw`
#include <algorithm>
#include <array>
#include <bitset>
#include <chrono>
#include <climits>
#include <cmath>
#include <cstdlib>
#include <cstring>
#include <deque>
#include <functional>
#include <iomanip>
#include <iostream>
#include <iterator>
#include <limits>
#include <list>
#include <map>
#include <memory>
#include <numeric>
#include <queue>
#include <set>
#include <sstream>
#include <stack>
#include <stdexcept>
#include <string>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>
using namespace std;

struct Json {
  enum Type { NUL, BOOL, NUM, STR, ARR, OBJ };
  Type t;
  bool b;
  double n;
  string s;
  vector<Json> a;
  vector<pair<string, Json> > o;

  Json() : t(NUL), b(false), n(0) {}

  static Json ofNull() { return Json(); }
  static Json of(bool v) { Json j; j.t = BOOL; j.b = v; return j; }
  static Json of(double v) { Json j; j.t = NUM; j.n = v; return j; }
  static Json of(int v) { return of((double) v); }
  static Json of(long long v) { return of((double) v); }
  static Json of(size_t v) { return of((double) v); }
  static Json of(const string& v) { Json j; j.t = STR; j.s = v; return j; }
  static Json of(const char* v) { return of(string(v)); }
  static Json ofList(const vector<Json>& v) { Json j; j.t = ARR; j.a = v; return j; }
  static Json ofMap(const vector<pair<string, Json> >& v) { Json j; j.t = OBJ; j.o = v; return j; }

  static Json ofInts(const vector<int>& v) {
    vector<Json> r;
    for (size_t i = 0; i < v.size(); i++) r.push_back(of(v[i]));
    return ofList(r);
  }
  static Json ofLongs(const vector<long long>& v) {
    vector<Json> r;
    for (size_t i = 0; i < v.size(); i++) r.push_back(of(v[i]));
    return ofList(r);
  }
  static Json ofStrings(const vector<string>& v) {
    vector<Json> r;
    for (size_t i = 0; i < v.size(); i++) r.push_back(of(v[i]));
    return ofList(r);
  }
  static Json ofIntGrid(const vector<vector<int> >& v) {
    vector<Json> r;
    for (size_t i = 0; i < v.size(); i++) r.push_back(ofInts(v[i]));
    return ofList(r);
  }
  static Json ofIntMap(const map<string, int>& m) {
    vector<pair<string, Json> > r;
    for (map<string, int>::const_iterator it = m.begin(); it != m.end(); ++it)
      r.push_back(make_pair(it->first, of(it->second)));
    return ofMap(r);
  }
  static Json ofIndexMap(const map<int, int>& m) {
    vector<pair<string, Json> > r;
    ostringstream ss;
    for (map<int, int>::const_iterator it = m.begin(); it != m.end(); ++it) {
      ss.str("");
      ss << it->first;
      r.push_back(make_pair(ss.str(), of(it->second)));
    }
    return ofMap(r);
  }

  bool isNull() const { return t == NUL; }
  bool isArr() const { return t == ARR; }
  bool isObj() const { return t == OBJ; }
  bool isNum() const { return t == NUM; }
  bool isStr() const { return t == STR; }
  double num() const { return n; }
  int asInt() const { return (int) n; }
  long long asLong() const { return (long long) n; }
  const string& str() const { return s; }
  bool boolean() const { return b; }
  const vector<Json>& list() const { return a; }
  size_t size() const { return t == ARR ? a.size() : (t == OBJ ? o.size() : 0); }
  const Json& at(size_t i) const { return a[i]; }

  const Json& key(const string& k) const {
    static const Json nullValue;
    for (size_t i = 0; i < o.size(); i++)
      if (o[i].first == k) return o[i].second;
    return nullValue;
  }
  bool has(const string& k) const {
    for (size_t i = 0; i < o.size(); i++)
      if (o[i].first == k) return true;
    return false;
  }

  vector<int> ints() const {
    vector<int> r;
    for (size_t i = 0; i < a.size(); i++) r.push_back(a[i].asInt());
    return r;
  }
  vector<long long> longs() const {
    vector<long long> r;
    for (size_t i = 0; i < a.size(); i++) r.push_back(a[i].asLong());
    return r;
  }
  /** Null elements come through as empty strings. */
  vector<string> strings() const {
    vector<string> r;
    for (size_t i = 0; i < a.size(); i++) r.push_back(a[i].isNull() ? string() : a[i].str());
    return r;
  }
  vector<vector<int> > intGrid() const {
    vector<vector<int> > r;
    for (size_t i = 0; i < a.size(); i++) r.push_back(a[i].ints());
    return r;
  }
  map<string, int> intMap() const {
    map<string, int> r;
    for (size_t i = 0; i < o.size(); i++) r[o[i].first] = o[i].second.asInt();
    return r;
  }
  map<string, vector<string> > stringListMap() const {
    map<string, vector<string> > r;
    for (size_t i = 0; i < o.size(); i++) r[o[i].first] = o[i].second.strings();
    return r;
  }

  static string numStr(double d) {
    if (d != d) return "null";
    if (d > 1e308 || d < -1e308) return "null";
    if (d == floor(d) && fabs(d) < 1e15) {
      ostringstream ss;
      ss << (long long) d;
      return ss.str();
    }
    for (int p = 15; p <= 17; p++) {
      ostringstream ss;
      ss << setprecision(p) << d;
      if (strtod(ss.str().c_str(), 0) == d) return ss.str();
    }
    ostringstream ss;
    ss << setprecision(17) << d;
    return ss.str();
  }

  static void esc(ostringstream& out, const string& v) {
    out << '"';
    for (size_t i = 0; i < v.size(); i++) {
      unsigned char c = (unsigned char) v[i];
      if (c == '"') out << "\\\"";
      else if (c == '\\') out << "\\\\";
      else if (c == '\n') out << "\\n";
      else if (c == '\r') out << "\\r";
      else if (c == '\t') out << "\\t";
      else if (c < 0x20) {
        out << "\\u" << hex << setw(4) << setfill('0') << (int) c << dec << setfill(' ');
      } else out << (char) c;
    }
    out << '"';
  }

  // Canonical form: object keys sorted, so equality is a string compare.
  void write(ostringstream& out) const {
    if (t == NUL) { out << "null"; return; }
    if (t == BOOL) { out << (b ? "true" : "false"); return; }
    if (t == NUM) { out << numStr(n); return; }
    if (t == STR) { esc(out, s); return; }
    if (t == ARR) {
      out << '[';
      for (size_t i = 0; i < a.size(); i++) { if (i) out << ','; a[i].write(out); }
      out << ']';
      return;
    }
    vector<pair<string, Json> > sorted = o;
    sort(sorted.begin(), sorted.end(), byKey);
    out << '{';
    for (size_t i = 0; i < sorted.size(); i++) {
      if (i) out << ',';
      esc(out, sorted[i].first);
      out << ':';
      sorted[i].second.write(out);
    }
    out << '}';
  }

  static bool byKey(const pair<string, Json>& x, const pair<string, Json>& y) {
    return x.first < y.first;
  }

  string dump() const { ostringstream ss; write(ss); return ss.str(); }

  static Json parse(const string& src) { size_t p = 0; return parseValue(src, p); }

 private:
  static void ws(const string& s, size_t& p) {
    while (p < s.size() && (s[p] == ' ' || s[p] == '\n' || s[p] == '\t' || s[p] == '\r')) p++;
  }

  static string parseString(const string& s, size_t& p) {
    string out;
    p++;
    for (;;) {
      char c = s[p++];
      if (c == '"') break;
      if (c != '\\') { out += c; continue; }
      char e = s[p++];
      if (e == 'n') out += '\n';
      else if (e == 't') out += '\t';
      else if (e == 'r') out += '\r';
      else if (e == 'b') out += '\b';
      else if (e == 'f') out += '\f';
      else if (e == 'u') {
        int cp = (int) strtol(s.substr(p, 4).c_str(), 0, 16);
        p += 4;
        if (cp < 0x80) out += (char) cp;
        else if (cp < 0x800) {
          out += (char) (0xC0 | (cp >> 6));
          out += (char) (0x80 | (cp & 0x3F));
        } else {
          out += (char) (0xE0 | (cp >> 12));
          out += (char) (0x80 | ((cp >> 6) & 0x3F));
          out += (char) (0x80 | (cp & 0x3F));
        }
      } else out += e;
    }
    return out;
  }

  static Json parseValue(const string& s, size_t& p) {
    ws(s, p);
    char c = s[p];
    if (c == '{') {
      p++;
      vector<pair<string, Json> > fields;
      ws(s, p);
      if (s[p] == '}') { p++; return ofMap(fields); }
      for (;;) {
        ws(s, p);
        string k = parseString(s, p);
        ws(s, p);
        p++;
        fields.push_back(make_pair(k, parseValue(s, p)));
        ws(s, p);
        char d = s[p++];
        if (d == '}') break;
      }
      return ofMap(fields);
    }
    if (c == '[') {
      p++;
      vector<Json> items;
      ws(s, p);
      if (s[p] == ']') { p++; return ofList(items); }
      for (;;) {
        items.push_back(parseValue(s, p));
        ws(s, p);
        char d = s[p++];
        if (d == ']') break;
      }
      return ofList(items);
    }
    if (c == '"') return of(parseString(s, p));
    if (c == 't') { p += 4; return of(true); }
    if (c == 'f') { p += 5; return of(false); }
    if (c == 'n') { p += 4; return ofNull(); }
    size_t start = p;
    while (p < s.size() && string("+-0123456789.eE").find(s[p]) != string::npos) p++;
    return of(strtod(s.substr(start, p - start).c_str(), 0));
  }
};

static string __b64decode(const string& in) {
  static const string tbl = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  string out;
  int val = 0, bits = -8;
  for (size_t i = 0; i < in.size(); i++) {
    size_t idx = tbl.find(in[i]);
    if (idx == string::npos) continue;
    val = (val << 6) + (int) idx;
    bits += 6;
    if (bits >= 0) {
      out += (char) ((val >> bits) & 0xFF);
      bits -= 8;
    }
  }
  return out;
}
`;

function cppMain(entry: string, payloadB64: string, marker: string): string {
  return String.raw`
int main() {
  const string MARKER = ${JSON.stringify(marker)};
  const string PAYLOAD = ${JSON.stringify(payloadB64)};

  Json payload = Json::parse(__b64decode(PAYLOAD));
  const vector<Json>& tests = payload.key("tests").list();
  vector<Json> verdicts;
  bool all = true;

  for (size_t i = 0; i < tests.size(); i++) {
    const Json& test = tests[i];
    const vector<Json>& input = test.key("input").list();
    string expected = test.key("expected").dump();

    ostringstream shown;
    for (size_t k = 0; k < input.size(); k++) {
      if (k) shown << ", ";
      shown << input[k].dump();
    }

    ostringstream captured;
    streambuf* saved = cout.rdbuf(captured.rdbuf());
    chrono::steady_clock::time_point start = chrono::steady_clock::now();
    string got = "—";
    string error;
    bool threw = false;
    try {
      got = ` + entry + String.raw`(input).dump();
    } catch (const exception& e) {
      threw = true;
      error = e.what();
    } catch (...) {
      threw = true;
      error = "unknown error";
    }
    double ms = chrono::duration<double, milli>(chrono::steady_clock::now() - start).count();
    cout.rdbuf(saved);

    bool pass = !threw && got == expected;
    if (!pass) all = false;

    vector<Json> logs;
    string capturedText = captured.str();
    string line;
    istringstream lineStream(capturedText);
    while (logs.size() < 50 && getline(lineStream, line)) logs.push_back(Json::of(line));

    vector<pair<string, Json> > v;
    string name = test.key("name").isNull() ? "" : test.key("name").str();
    if (name.empty()) {
      ostringstream ns;
      ns << "Case " << (i + 1);
      name = ns.str();
    }
    v.push_back(make_pair("name", Json::of(name)));
    v.push_back(make_pair("input", Json::of(shown.str())));
    v.push_back(make_pair("expected", Json::of(expected)));
    v.push_back(make_pair("got", Json::of(got)));
    v.push_back(make_pair("pass", Json::of(pass)));
    if (threw) v.push_back(make_pair("error", Json::of(error)));
    v.push_back(make_pair("timeMs", Json::of(ms)));
    v.push_back(make_pair("logs", Json::ofList(logs)));
    verdicts.push_back(Json::ofMap(v));
  }

  vector<pair<string, Json> > out;
  out.push_back(make_pair("status", Json::of(all ? string("pass") : string("fail"))));
  out.push_back(make_pair("verdicts", Json::ofList(verdicts)));
  cout << "\n" << MARKER << Json::ofMap(out).dump() << "\n";
  return 0;
}
`;
}

/** Assembles the full C++ translation unit Judge0 compiles. */
export function buildCppSource(
  code: string,
  driverCode: string,
  entry: string,
  payloadB64: string,
  marker: string,
): string {
  return [CPP_PRELUDE, code, driverCode, cppMain(entry, payloadB64, marker)].join(
    "\n",
  );
}
