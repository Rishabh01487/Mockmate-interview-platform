const snakeToCamel = (s) =>
  s.replace(/-./g, (w) => w[1].toUpperCase());

const STUBS = {
  cpp: (slug) => `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* ${snakeToCamel(slug)}(ListNode* head) {
        
    }
};`,
  java: (slug) => `class Solution {
    public ListNode ${snakeToCamel(slug)}(ListNode head) {
        
    }
}`,
  python: (slug) => `from typing import Optional

class Solution:
    def ${snakeToCamel(slug)}(self, head: Optional[ListNode]) -> Optional[ListNode]:
        
`,
  javascript: (slug) => `/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var ${snakeToCamel(slug)} = function(head) {
    
};`,
};

export function getStub(lang, slug) {
  const fn = STUBS[lang];
  if (!fn) return '';
  return fn(slug || 'solve');
}
