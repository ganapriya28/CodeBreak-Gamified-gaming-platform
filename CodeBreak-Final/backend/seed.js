require('dotenv').config();
const { connectDB, getDB, closeDB } = require('./db');

const algorithm = [
  ['Initialize Maximum','Find the largest value in a list.',['Set largest to the first value.','Visit each remaining value.','If the current value is larger, update largest.','Print largest.']],
  ['Array Sum','Calculate the sum of all values.',['Set total to 0.','Visit each number.','Add the number to total.','Print total.']],
  ['Count Evens','Count how many values are even.',['Set count to 0.','Visit each number.','If the number is divisible by 2, increase count.','Print count.']],
  ['Linear Search','Find a target value by checking items one by one.',['Start at the first item.','Compare the current item with the target.','If they are equal, report found.','Otherwise move to the next item.']],
  ['Find Minimum','Find the smallest value in a list.',['Set smallest to the first value.','Visit each remaining value.','If the current value is smaller, update smallest.','Print smallest.']],
  ['Average','Calculate the average of a list.',['Calculate the sum.','Count the values.','Divide the sum by the count.','Print the average.']],
  ['Reverse Array','Create the reverse order of a list.',['Create an empty result list.','Start from the last item.','Append each item to result.','Print result.']],
  ['Palindrome','Check whether a word reads the same backwards.',['Keep the original word.','Create its reverse.','Compare the original with the reverse.','Report whether they match.']],
  ['Frequency Count','Count how many times each value appears.',['Create an empty frequency map.','Visit each value.','Increase its count in the map.','Print the frequencies.']],
  ['Remove Duplicates','Keep only the first occurrence of each value.',['Create an empty result list.','Visit each value.','If it is not already in result, append it.','Print result.']],
  ['Second Largest','Find the second largest distinct value.',['Track the largest value.','Track the second largest value.','Update both when a larger value is found.','Print the second largest.']],
  ['Two Sum','Find two values whose sum equals a target.',['Visit each value.','Check the values that come after it.','If their sum equals the target, report the pair.','Stop when the pair is found.']],
  ['Bubble Sort','Sort values using repeated adjacent swaps.',['Compare adjacent values.','Swap them if they are in the wrong order.','Repeat passes until no swap is needed.','Print the sorted list.']],
  ['Selection Sort','Sort by repeatedly selecting the smallest remaining value.',['Find the smallest remaining value.','Swap it into the next position.','Move the boundary one position right.','Repeat until sorted.']],
  ['Binary Search','Find a target in a sorted list efficiently.',['Set low to the first index and high to the last.','Find the middle index.','If the middle value is the target, report found.','Move low or high based on the comparison and repeat.']],
  ['Prefix Sum','Build running sums for quick range totals.',['Create an empty prefix list.','Add each value to a running total.','Store the running total.','Use prefix values to answer range sums.']],
  ['Valid Parentheses','Check whether brackets are correctly nested.',['Create an empty stack.','Push every opening bracket.','For a closing bracket, check the stack top.','At the end, the stack must be empty.']],
  ['Queue Simulation','Process items in first-in-first-out order.',['Add items to the back of the queue.','Look at the item at the front.','Remove the front item after processing.','Continue until the queue is empty.']],
  ['Merge Sorted Arrays','Combine two sorted arrays into one sorted array.',['Create two pointers at the starts of both arrays.','Compare the pointed values.','Append the smaller value and move that pointer.','Append any remaining values.']],
  ['Sliding Window','Find the largest sum of k consecutive values.',['Calculate the sum of the first window.','Store it as the best sum.','Slide the window one position at a time.','Update the best sum after each slide.']]
];

const coding = [
  ['Print Numbers','Print numbers from 1 to 5.','for i in range(1, ___):\n    print(i)','for i in range(1, 6):\n    print(i)','1\n2\n3\n4\n5',['The stop value is exclusive.','You need one value after 5 as the stop.']],
  ['Array Sum','Print the sum of [1,2,3,4,5].','nums=[1,2,3,4,5]\nprint(sum(nums))','nums=[1,2,3,4,5]\nprint(sum(nums))','15',['sum adds all values.']],
  ['Count Evens','Print the number of even values.','nums=[2,5,8,9,10]\ncount=0\nfor n in nums:\n    if n % 2 == ___:\n        count += 1\nprint(count)','nums=[2,5,8,9,10]\ncount=0\nfor n in nums:\n    if n % 2 == 0:\n        count += 1\nprint(count)','3',['Even numbers have remainder 0 when divided by 2.']],
  ['Linear Search','Print FOUND when target 7 exists.','nums=[3,5,7,9]\ntarget=7\nif target ___ nums:\n    print("FOUND")','nums=[3,5,7,9]\ntarget=7\nif target in nums:\n    print("FOUND")','FOUND',['Use the membership operator.']],
  ['Find Minimum','Print the smallest value.','nums=[8,3,6,1,9]\nprint(min(nums))','nums=[8,3,6,1,9]\nprint(min(nums))','1',['min returns the smallest value.']],
  ['Average','Print the average of 10,20,30.','nums=[10,20,30]\nprint(sum(nums) ___ len(nums))','nums=[10,20,30]\nprint(sum(nums) / len(nums))','20.0',['Average is sum divided by count.']],
  ['Reverse Array','Print the list backwards.','nums=[1,2,3,4]\nprint(nums[___])','nums=[1,2,3,4]\nprint(nums[::-1])','[4, 3, 2, 1]',['A negative step walks backwards.']],
  ['Palindrome','Print True for level.','word="level"\nprint(word == word[___])','word="level"\nprint(word == word[::-1])','True',['Compare the word with its reverse.']],
  ['Frequency Count','Print how many times 2 appears.','nums=[2,1,2,3,2]\nprint(nums.count(___))','nums=[2,1,2,3,2]\nprint(nums.count(2))','3',['count needs the value to count.']],
  ['Remove Duplicates','Print unique values in order.','nums=[1,2,2,3,1]\nresult=[]\nfor n in nums:\n    if n ___ result:\n        result.append(n)\nprint(result)','nums=[1,2,2,3,1]\nresult=[]\nfor n in nums:\n    if n not in result:\n        result.append(n)\nprint(result)','[1, 2, 3]',['Append only values that are not already present.']],
  ['Second Largest','Print the second largest distinct value.','nums=[10,5,8,10,7]\nunique=sorted(set(nums))\nprint(unique[___])','nums=[10,5,8,10,7]\nunique=sorted(set(nums))\nprint(unique[-2])','8',['Remove duplicates, sort, then take the second from the end.']],
  ['Two Sum','Print the first pair that sums to 9.','nums=[2,7,4,5]\ntarget=9\nfor i in range(len(nums)):\n    for j in range(i+1,len(nums)):\n        if nums[i]+nums[j] == target:\n            print(nums[i], nums[j])','nums=[2,7,4,5]\ntarget=9\nfor i in range(len(nums)):\n    for j in range(i+1,len(nums)):\n        if nums[i]+nums[j] == target:\n            print(nums[i], nums[j])\n            raise SystemExit','2 7',['Try pairs without reusing the same position.']],
  ['Bubble Sort','Print the sorted list.','nums=[5,1,4,2]\nfor i in range(len(nums)):\n    for j in range(0, len(nums)-i-1):\n        if nums[j] ___ nums[j+1]:\n            nums[j],nums[j+1]=nums[j+1],nums[j]\nprint(nums)','nums=[5,1,4,2]\nfor i in range(len(nums)):\n    for j in range(0, len(nums)-i-1):\n        if nums[j] > nums[j+1]:\n            nums[j],nums[j+1]=nums[j+1],nums[j]\nprint(nums)','[1, 2, 4, 5]',['Swap when the left value is greater.']],
  ['Selection Sort','Print the sorted list.','nums=[4,2,5,1]\nfor i in range(len(nums)):\n    m=i\n    for j in range(i+1,len(nums)):\n        if nums[j] < nums[m]: m=j\n    nums[i],nums[m]=nums[m],nums[i]\nprint(nums)','nums=[4,2,5,1]\nfor i in range(len(nums)):\n    m=i\n    for j in range(i+1,len(nums)):\n        if nums[j] < nums[m]: m=j\n    nums[i],nums[m]=nums[m],nums[i]\nprint(nums)','[1, 2, 4, 5]',['Find the smallest remaining value.']],
  ['Binary Search','Print the index of 7.','nums=[1,3,5,7,9]\nlo,hi=0,len(nums)-1\nwhile lo <= hi:\n    mid=(lo+hi)//2\n    if nums[mid] == 7:\n        print(mid)\n        break\n    elif nums[mid] < 7: lo=mid+1\n    else: hi=mid-1','nums=[1,3,5,7,9]\nlo,hi=0,len(nums)-1\nwhile lo <= hi:\n    mid=(lo+hi)//2\n    if nums[mid] == 7:\n        print(mid)\n        break\n    elif nums[mid] < 7: lo=mid+1\n    else: hi=mid-1','3',['The middle value tells you which half to discard.']],
  ['Prefix Sum','Print the prefix sums.','nums=[2,4,1,3]\nrunning=0\nans=[]\nfor n in nums:\n    running += n\n    ans.append(running)\nprint(ans)','nums=[2,4,1,3]\nrunning=0\nans=[]\nfor n in nums:\n    running += n\n    ans.append(running)\nprint(ans)','[2, 6, 7, 10]',['Keep a running total.']],
  ['Valid Parentheses','Print True for ({[]}).','s="({[]})"\npairs={")":"(","]":"[","}":"{"}\nst=[]\nfor ch in s:\n    if ch in "([{": st.append(ch)\n    elif not st or st.pop() != pairs[ch]:\n        print(False); break\nelse:\n    print(len(st) == 0)','s="({[]})"\npairs={")":"(","]":"[","}":"{"}\nst=[]\nfor ch in s:\n    if ch in "([{": st.append(ch)\n    elif not st or st.pop() != pairs[ch]:\n        print(False); break\nelse:\n    print(len(st) == 0)','True',['Opening brackets go onto a stack.']],
  ['Queue Simulation','Process the queue and print the order.','from collections import deque\nq=deque([1,2,3])\nwhile q:\n    print(q.___())','from collections import deque\nq=deque([1,2,3])\nwhile q:\n    print(q.popleft())','1\n2\n3',['A queue removes from the front.']],
  ['Merge Sorted Arrays','Print the merged sorted array.','a=[1,4,7]\nb=[2,3,8]\nprint(sorted(a+b))','a=[1,4,7]\nb=[2,3,8]\nprint(sorted(a+b))','[1, 2, 3, 4, 7, 8]',['The result must stay sorted.']],
  ['Sliding Window','Find the largest sum of 3 consecutive values.','nums=[2,1,5,1,3,2]\nk=3\nbest=max(sum(nums[i:i+k]) for i in range(len(nums)-k+1))\nprint(best)','nums=[2,1,5,1,3,2]\nk=3\nbest=max(sum(nums[i:i+k]) for i in range(len(nums)-k+1))\nprint(best)','9',['The best window is 5,1,3.']]
];

const bugs = [
  ['Comparison Bug','Make the program print PASS when score is exactly 50.','score=50\nif score > 50:\n    print("PASS")','score=50\nif score >= 50:\n    print("PASS")','PASS',['The boundary value must be included.']],
  ['Counter Reset','Fix the counter so it prints 3.','nums=[2,4,6]\ncount=0\nfor n in nums:\n    count=0\n    count += 1\nprint(count)','nums=[2,4,6]\ncount=0\nfor n in nums:\n    count += 1\nprint(count)','3',['Do not reset the counter on every iteration.']],
  ['Range Bug','Print 1 through 5.','for i in range(1,5):\n    print(i)','for i in range(1,6):\n    print(i)','1\n2\n3\n4\n5',['The stop value is excluded.']],
  ['Even Bug','Print EVEN for 8.','n=8\nif n % 2 == 1:\n    print("EVEN")','n=8\nif n % 2 == 0:\n    print("EVEN")','EVEN',['Even numbers leave remainder zero.']],
  ['Loop Update','Make the loop finish after printing 1,2,3.','i=1\nwhile i<=3:\n    print(i)','i=1\nwhile i<=3:\n    print(i)\n    i+=1','1\n2\n3',['The loop variable must move toward the condition becoming false.']],
  ['Wrong Index','Print the last value.','nums=[10,20,30]\nprint(nums[0])','nums=[10,20,30]\nprint(nums[-1])','30',['Negative one means the last item.']],
  ['Wrong Operator','Print 25.','n=5\nprint(n*3)','n=5\nprint(n**2)','25',['A square multiplies a number by itself.']],
  ['Missing Return','Make the function return 10.','def add(a,b):\n    x=a+b\nprint(add(4,6))','def add(a,b):\n    return a+b\nprint(add(4,6))','10',['The caller needs the function result.']],
  ['Palindrome Bug','Print True for level.','word="level"\nprint(word == word[::-1][::-1])','word="level"\nprint(word == word[::-1])','True',['Compare the word to its reverse.']],
  ['Duplicate Bug','Print [1,2,3].','nums=[1,2,2,3]\nprint(list(set(nums)))','nums=[1,2,2,3]\nresult=[]\nfor n in nums:\n    if n not in result: result.append(n)\nprint(result)','[1, 2, 3]',['A set removes duplicates but does not guarantee original order.']],
  ['Second Largest','Print 8.','nums=[10,5,8,10,7]\nprint(sorted(nums)[-2])','nums=[10,5,8,10,7]\nprint(sorted(set(nums))[-2])','8',['Distinct values are required.']],
  ['Two Sum','Print 2 7.','nums=[2,7,4,5]\nfor a in nums:\n    for b in nums:\n        if a+b==9: print(a,b); break','nums=[2,7,4,5]\ntarget=9\nfor i in range(len(nums)):\n    for j in range(i+1,len(nums)):\n        if nums[i]+nums[j]==target:\n            print(nums[i],nums[j]); raise SystemExit','2 7',['Do not reuse the same position.']],
  ['Bubble Swap','Sort the list.','nums=[5,1,4,2]\nfor i in range(len(nums)):\n    for j in range(len(nums)-i-1):\n        if nums[j] < nums[j+1]: nums[j],nums[j+1]=nums[j+1],nums[j]\nprint(nums)','nums=[5,1,4,2]\nfor i in range(len(nums)):\n    for j in range(len(nums)-i-1):\n        if nums[j] > nums[j+1]: nums[j],nums[j+1]=nums[j+1],nums[j]\nprint(nums)','[1, 2, 4, 5]',['Swap when the left value is larger.']],
  ['Selection Boundary','Sort the list.','nums=[4,2,5,1]\nfor i in range(len(nums)-1):\n    m=i\n    for j in range(i+1,len(nums)):\n        if nums[j] < nums[m]: m=j\n    nums[i],nums[m]=nums[m],nums[i]\nprint(nums)','nums=[4,2,5,1]\nfor i in range(len(nums)):\n    m=i\n    for j in range(i+1,len(nums)):\n        if nums[j] < nums[m]: m=j\n    nums[i],nums[m]=nums[m],nums[i]\nprint(nums)','[1, 2, 4, 5]',['Each pass fixes the next position.']],
  ['Binary Search Direction','Print 3.','nums=[1,3,5,7,9]\nlo,hi=0,len(nums)-1\nwhile lo<=hi:\n    mid=(lo+hi)//2\n    if nums[mid]==7: print(mid); break\n    if nums[mid]<7: hi=mid-1\n    else: lo=mid+1','nums=[1,3,5,7,9]\nlo,hi=0,len(nums)-1\nwhile lo<=hi:\n    mid=(lo+hi)//2\n    if nums[mid]==7: print(mid); break\n    if nums[mid]<7: lo=mid+1\n    else: hi=mid-1','3',['If the middle is too small, search the right half.']],
  ['Prefix Reset','Print [2,6,7,10].','nums=[2,4,1,3]\nrunning=0\nans=[]\nfor n in nums:\n    running=n\n    ans.append(running)\nprint(ans)','nums=[2,4,1,3]\nrunning=0\nans=[]\nfor n in nums:\n    running += n\n    ans.append(running)\nprint(ans)','[2, 6, 7, 10]',['A prefix sum keeps the previous total.']],
  ['Stack Bug','Print True for ({[]}).','s="({[]})"\npairs={")":"(","]":"[","}":"{"}\nst=[]\nfor ch in s:\n    if ch in "([{": st.append(ch)\n    else:\n        if not st or st.pop() != pairs[ch]: print(False); break\nelse: print(False)','s="({[]})"\npairs={")":"(","]":"[","}":"{"}\nst=[]\nfor ch in s:\n    if ch in "([{": st.append(ch)\n    elif not st or st.pop() != pairs[ch]: print(False); break\nelse: print(len(st)==0)','True',['The success case should check that the stack is empty.']],
  ['Queue Bug','Print 1,2,3 in order.','from collections import deque\nq=deque([1,2,3])\nwhile q: print(q.pop())','from collections import deque\nq=deque([1,2,3])\nwhile q: print(q.popleft())','1\n2\n3',['A queue is first-in-first-out.']],
  ['Merge Order','Print the merged sorted list.','a=[1,4,7]\nb=[2,3,8]\nprint(a+b)','a=[1,4,7]\nb=[2,3,8]\nprint(sorted(a+b))','[1, 2, 3, 4, 7, 8]',['The merged result must be sorted.']],
  ['Window Size','Print 9.','nums=[2,1,5,1,3,2]\nk=2\nprint(max(sum(nums[i:i+k]) for i in range(len(nums)-k+1)))','nums=[2,1,5,1,3,2]\nk=3\nprint(max(sum(nums[i:i+k]) for i in range(len(nums)-k+1)))','9',['The challenge asks for 3 consecutive values.']]
];

function makeCoding(roomType, rows) {
  return rows.map((r,i)=>({ roomType, level:i+1, language:'python', title:r[0], prompt:r[1], starterCode:r[2], solution:r[3], expectedOutput:r[4], hints:r[5], difficulty:i+1, concept:algorithm[i][0] }));
}

const vault = makeCoding('vault', coding);
const debug = makeCoding('debug', bugs);
const team = makeCoding('team', coding.map((r,i)=> i===11 ? [r[0], 'Work together to find the first pair whose sum is 9.', r[2], r[3], r[4], r[5]] : r));

const base = [
  ...algorithm.map((a,i)=>({ roomType:'algorithm', level:i+1, language:'python', title:a[0], prompt:a[1], steps:a[2], hints:['Think about what must happen before the next step.','Trace the data from input to output.'], difficulty:i+1, concept:a[0] })),
  ...vault, ...debug, ...team
];

function languageVariants(q) {
  const out = String(q.expectedOutput || '');
  const cLines = out ? out.split('\n').map(x=>`printf("${x.replace(/\\/g,'\\\\').replace(/"/g,'\\"')}\\n");`).join('\n  ') : 'printf("OK\\n");';
  const jLines = out ? out.split('\n').map(x=>`System.out.println("${x.replace(/\\/g,'\\\\').replace(/"/g,'\\"')}");`).join('\n    ') : 'System.out.println("OK");';

  // Debugger's Lab must start with a real, runnable bug in every language.
  // Use safe, short examples whose fixed output is deterministic.
  if (q.roomType === 'debug') {
    const n = Number(q.level) || 1;
    const bugType = (n - 1) % 5;
    const score = 40 + n;
    const debugPrompts = [
      { title: `Boundary Check ${n}`, prompt: `The program should print PASS when score equals the minimum required score (${score}). Fix the faulty comparison.`, expected: 'PASS', cBad: `#include <stdio.h>\nint main(void) { int score=${score}; int minimum=${score}; if (score > minimum) printf("PASS\\n"); return 0; }`, cGood: `#include <stdio.h>\nint main(void) { int score=${score}; int minimum=${score}; if (score >= minimum) printf("PASS\\n"); return 0; }`, jBad: `public class Main { public static void main(String[] args) { int score=${score}, minimum=${score}; if (score > minimum) System.out.println("PASS"); } }`, jGood: `public class Main { public static void main(String[] args) { int score=${score}, minimum=${score}; if (score >= minimum) System.out.println("PASS"); } }` },
      { title: `Counter Repair ${n}`, prompt: 'Fix the counter so the program counts all three items and prints 3.', expected: '3', cBad: '#include <stdio.h>\nint main(void) { int count=0; for(int i=0;i<3;i++){ count=0; count++; } printf("%d\\n", count); return 0; }', cGood: '#include <stdio.h>\nint main(void) { int count=0; for(int i=0;i<3;i++){ count++; } printf("%d\\n", count); return 0; }', jBad: 'public class Main { public static void main(String[] args) { int count=0; for(int i=0;i<3;i++){ count=0; count++; } System.out.println(count); } }', jGood: 'public class Main { public static void main(String[] args) { int count=0; for(int i=0;i<3;i++){ count++; } System.out.println(count); } }' },
      { title: `Loop Boundary ${n}`, prompt: 'Fix the loop boundary so the program prints the numbers 1 through 5, each on a new line.', expected: '1\n2\n3\n4\n5', cBad: '#include <stdio.h>\nint main(void) { for(int i=1;i<5;i++) printf("%d\\n", i); return 0; }', cGood: '#include <stdio.h>\nint main(void) { for(int i=1;i<=5;i++) printf("%d\\n", i); return 0; }', jBad: 'public class Main { public static void main(String[] args) { for(int i=1;i<5;i++) System.out.println(i); } }', jGood: 'public class Main { public static void main(String[] args) { for(int i=1;i<=5;i++) System.out.println(i); } }' },
      { title: `Index Repair ${n}`, prompt: 'Fix the array index so the program prints the last value, 30.', expected: '30', cBad: '#include <stdio.h>\nint main(void) { int nums[]={10,20,30}; printf("%d\\n", nums[0]); return 0; }', cGood: '#include <stdio.h>\nint main(void) { int nums[]={10,20,30}; printf("%d\\n", nums[2]); return 0; }', jBad: 'public class Main { public static void main(String[] args) { int[] nums={10,20,30}; System.out.println(nums[0]); } }', jGood: 'public class Main { public static void main(String[] args) { int[] nums={10,20,30}; System.out.println(nums[2]); } }' },
      { title: `Operator Repair ${n}`, prompt: 'Fix the operator so the program prints the square of 5, which is 25.', expected: '25', cBad: '#include <stdio.h>\nint main(void) { int n=5; printf("%d\\n", n*3); return 0; }', cGood: '#include <stdio.h>\nint main(void) { int n=5; printf("%d\\n", n*n); return 0; }', jBad: 'public class Main { public static void main(String[] args) { int n=5; System.out.println(n*3); } }', jGood: 'public class Main { public static void main(String[] args) { int n=5; System.out.println(n*n); } }' }
    ][bugType];
    // Keep the richer Python debugging curriculum and create real buggy C/Java variants.
    const cVariant = { ...q, language: 'c', title: debugPrompts.title, prompt: debugPrompts.prompt, starterCode: debugPrompts.cBad, solution: debugPrompts.cGood, expectedOutput: debugPrompts.expected };
    const javaVariant = { ...q, language: 'java', title: debugPrompts.title, prompt: debugPrompts.prompt, starterCode: debugPrompts.jBad, solution: debugPrompts.jGood, expectedOutput: debugPrompts.expected };
    return [q, cVariant, javaVariant];
  }

  return [
    q,
    {...q, language:'c', starterCode:q.starterCode ? '#include <stdio.h>\nint main(){\n  /* Build or fix the solution here */\n  return 0;\n}' : undefined, solution:`#include <stdio.h>\nint main(){\n  ${cLines}\n  return 0;\n}`, expectedOutput:out},
    {...q, language:'java', starterCode:q.starterCode ? 'public class Main {\n  public static void main(String[] args) {\n    // Build or fix the solution here\n  }\n}' : undefined, solution:`public class Main {\n  public static void main(String[] args) {\n    ${jLines}\n  }\n}`, expectedOutput:out}
  ];
}

async function main(){
  await connectDB();
  const db=getDB();
  const expanded=[];
  for(const q of base){
    if(q.roomType==='algorithm') expanded.push(q,{...q,language:'c'},{...q,language:'java'});
    else expanded.push(...languageVariants(q));
  }
  // Refresh the bundled starter curriculum without deleting AI-generated questions.
  await db.collection('questions').deleteMany({ generatedBy: { $exists: false } });
  await db.collection('questions').insertMany(expanded.map(q=>({...q,createdAt:new Date()})));
  console.log(`Seeded ${expanded.length} starter questions; existing AI-generated levels were preserved.`);
  await closeDB();
}
main().catch(async e=>{console.error(e);try{await closeDB()}catch{}process.exit(1)});
