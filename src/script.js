// Bilingual subtitle script — [start, end, 中文, English] (seconds on the film clock)
window.SUBS = [
  [0.6, 4.6, "一切，始于比特。", "Everything begins with a bit."],
  [5.0, 9.6, "0 与 1，本身没有任何意义。", "Zeros and ones mean nothing on their own."],
  [10.0, 15.2, "直到我们赋予它们——结构。", "Until we give them structure."],
  [18.2, 23.4, "数据结构：让信息拥有形状。", "Data structures: giving information a shape."],

  [28.0, 33.0, "数组：元素在内存中肩并肩排列。", "An array: elements standing shoulder to shoulder in memory."],
  [33.5, 38.6, "知道下标，一步直达——O(1)。", "Know the index, and you are there in one step — O(1)."],
  [39.0, 44.2, "地址 = 基址 + 下标 × 元素大小。", "Address = base + index × size."],
  [44.6, 49.6, "但在中间插入，后面所有人都得挪位。", "But insert in the middle, and everyone behind must move."],
  [50.0, 55.6, "连续，是它的速度，也是它的代价。", "Contiguity is its speed — and its price."],

  [60.0, 65.0, "链表放弃了连续，换来了自由。", "A linked list trades contiguity for freedom."],
  [65.4, 70.6, "每个节点只记得一件事：下一个在哪里。", "Each node remembers only one thing: where the next one is."],
  [71.0, 76.2, "插入？改两根指针，O(1)。", "Insert? Rewire two pointers. O(1)."],
  [76.6, 83.0, "查找？只能顺藤摸瓜，O(n)。", "Search? Follow the chain, one by one. O(n)."],

  [88.0, 93.0, "栈：后进，先出。", "Stack: last in, first out."],
  [93.4, 98.2, "函数调用、撤销操作，都住在栈里。", "Function calls and undo history all live on a stack."],
  [98.6, 103.6, "队列：先进先出，公平排队。", "Queue: first in, first out. Fair and orderly."],
  [104.0, 111.0, "限制操作，反而成就了力量。", "Constraint, it turns out, is a kind of power."],

  [116.0, 121.0, "哈希函数，把任意的键，变成一个位置。", "A hash function turns any key into a location."],
  [121.4, 126.6, "不必寻找——直接算出来。", "Don't search. Compute."],
  [127.0, 132.2, "两个键落进同一个桶？这就是冲突。", "Two keys, one bucket? That is a collision."],
  [132.6, 137.6, "链地址、开放寻址——各有解法。", "Chaining, open addressing — each has an answer."],
  [138.0, 143.4, "平均 O(1)，是现代软件的心跳。", "Average O(1) — the heartbeat of modern software."],

  [148.0, 153.0, "树：把数据组织成层级。", "A tree organizes data into a hierarchy."],
  [153.4, 158.6, "二叉搜索树：左小，右大。", "Binary search tree: smaller to the left, larger to the right."],
  [159.0, 164.2, "每走一步，排除一半可能。O(log n)。", "Every step discards half of what remains. O(log n)."],
  [164.6, 169.6, "十亿条数据，三十步之内找到。", "A billion records, found within thirty steps."],
  [170.0, 175.2, "失衡了？旋转，让它重新平衡。", "Out of balance? Rotate, and restore it."],
  [175.6, 179.6, "文件系统、数据库索引——都是树。", "File systems, database indexes — all trees."],

  [183.6, 188.2, "堆：最重要的，永远在顶端。", "A heap: the most important item is always on top."],
  [188.6, 193.6, "新元素逐层上浮，找到属于自己的位置。", "New elements sift up to find their rightful place."],
  [194.0, 199.6, "任务调度、最短路径，都靠它决定下一步。", "Schedulers and shortest paths ask it: what comes next?"],

  [204.0, 209.0, "图：万物皆节点，关系即是边。", "A graph: everything is a node, every relation an edge."],
  [209.4, 214.6, "社交网络、地图导航、互联网本身。", "Social networks. Maps. The Internet itself."],
  [215.0, 220.2, "广度优先：像水波一样，一层层扩散。", "Breadth-first: spreading outward, ring by ring, like a ripple."],
  [220.6, 226.2, "Dijkstra：在千万条路中，找到最短的那一条。", "Dijkstra: among countless routes, find the shortest one."],
  [226.6, 232.2, "当结构足够丰富，世界就能被计算。", "When structure is rich enough, the world becomes computable."],

  [244.0, 249.2, "选择数据结构，就是选择时间的形状。", "Choosing a data structure is choosing the shape of time."],
  [249.6, 254.8, "O(1)、O(log n)、O(n)、O(n²)——规模一大，天壤之别。", "O(1), O(log n), O(n), O(n²) — at scale, worlds apart."],
  [255.2, 259.8, "n 为一百万时：1 步、20 步、百万步、一万亿步。", "At n = one million: 1 step, 20 steps, a million — a trillion."],
  [266.6, 275.4, "结构对了，算法会自己浮现。", "Get the structure right, and the algorithm reveals itself."],

  [277.2, 282.0, "你用的每一个应用，都建立在这些看不见的结构之上。", "Every app you use stands on these invisible structures."],
];
