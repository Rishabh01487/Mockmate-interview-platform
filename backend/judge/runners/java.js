const JDDOODLE_URL = 'https://api.jdoodle.com/v1/execute';

module.exports = {
  async run(code, input) {
    // Optional: Add wrapper for LeetCode's "Solution" class
    const wrappedCode = code.includes('class Solution') 
      ? `${code}\n\npublic class Main {
          public static void main(String[] args) {
            Solution sol = new Solution();
            // Parse input and call appropriate method (customize as needed)
            // Example: System.out.println(sol.twoSum(parseInput(args[0])));
          }
        }`
      : code;

    const body = {
      script: wrappedCode,
      stdin: input || '',
      language: 'java',
      versionIndex: '4', // Java 17
      clientId: process.env.JDDOODLE_CLIENT_ID,
      clientSecret: process.env.JDDOODLE_CLIENT_SECRET,
    };

    const response = await fetch(JDDOODLE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      output: result.output.trim(),
      error: result.memory || null,
    };
  },
};
