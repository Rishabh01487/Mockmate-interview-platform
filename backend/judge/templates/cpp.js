const HEADER = `
#include <vector>
#include <string>
#include <algorithm>
using namespace std;

struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

static ListNode* vecToList(const vector<int>& v) {
    ListNode dummy, *tail = &dummy;
    for (int x: v) tail = tail->next = new ListNode(x);
    return dummy.next;
}
static vector<int> listToVec(ListNode* head) {
    vector<int> v;
    while (head) { v.push_back(head->val); head = head->next; }
    return v;
}
`;

const MAIN = `
#include <iostream>
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n; cin >> n;
    vector<int> v(n);
    for (int i = 0; i < n; ++i) cin >> v[i];
    ListNode* head = vecToList(v);
    Solution sol;
    head = sol.solve(head);
    vector<int> res = listToVec(head);
    cout << res.size();
    for (int x: res) cout << " " << x;
    return 0;
}
`;

module.exports = { HEADER, MAIN };
