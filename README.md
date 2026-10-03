# 数据结构 · DATA STRUCTURES — *The Architecture of Thought*

一部 5 分钟的计算机数据结构宣传片。画面、运镜、转场、配乐、字幕全部由代码生成：每一帧都是时间 `t` 的纯函数，配乐里的每一个鼓点都写进了时间轴，画面直接对着它卡点。

A 5‑minute promotional film about computer data structures. Every frame is a pure function of time, and every drum hit of the original score is exported to the timeline the visuals sync to.

| | |
|---|---|
| 成片 / Film | `film/data_structures_1080p.mp4` — 1920×1080 · 30 fps · H.264 + AAC · 5:00 |
| 网页版 / Web player | `src/index.html` — 实时渲染，可拖动章节 / real‑time, chapter scrubbing |
| 字幕 / Subtitles | `subtitles.zh-en.srt` · `subtitles.zh.srt` · `subtitles.en.srt`（成片内已烧录中英双语） |
| 配乐 / Score | `src/score.mp3` — 原创合成，120 BPM，A 小调 / original synth score, 120 BPM, A minor |

## 结构 / Structure

| 时间 | 章节 | 视觉要点 |
|---|---|---|
| 0:00 | 序章 · 比特 | 第一个比特随铃声点亮 → 比特星系 → 排列成内存网格 → 坍缩 |
| 0:16 | 片名 | 冲击波 + 光束 + 轨道，大字片名 |
| 0:24 | 01 数组 | 3D 内存格、`arr[7]` 一束激光直达 O(1)、地址公式、插入时全员挪位 O(n)、拉升俯瞰后穿入格子 |
| 0:56 | 02 链表 | 散落在内存里的节点、追踪镜头跟随数据包跳转、指针断开与重连 O(1)、逐个查找 O(n) |
| 1:24 | 03 栈与队列 | 甩镜入场，调用栈 push/pop（LIFO），队列 enqueue/dequeue（FIFO），漩涡转场 |
| 1:52 | 04 哈希表 | 旋转晶体哈希函数、真实 djb2 计算、冲突报警、链地址法 → 开放寻址探测、均匀分布直方图 |
| 2:24 | 05 树 | BST 逐层比较插入、查找时每步剪掉一半、十亿节点 30 步、AVL 左旋、文件系统 |
| 3:00 | 06 堆 | 树与数组双视图同步，上浮 / 下沉交换，最大值弹出 |
| 3:20 | 07 图 | 3D 网络、BFS 波纹、Dijkstra 逐点定界与最短路径彗星、全曲高潮的星系级网络飞越 |
| 4:00 | 08 复杂度 | 增长曲线、n = 一百万时 1 步 / 20 步 / 1 秒 / 11.6 天、“算法 + 数据结构 = 程序”逐词砸入、全结构环绕 |
| 4:36 | 终章 | 比特星系回归，“结构，即思想”，片尾 |

所有卡点：章节切换与 12 个重击（impact）同拍；每章前 1–2 小节有上升音效（riser）与鼓组过门；底鼓驱动画面微缩放与 HUD 指示灯；高潮段的边脉冲落在 16 分音符上。

## 重新生成 / Rebuild

```bash
python3 tools/compose.py            # 合成配乐 → build/score.wav + src/events.js（节拍时间轴）
ffmpeg -i build/score.wav -af loudnorm=I=-14:TP=-1 build/score_master.wav
ffmpeg -i build/score_master.wav -b:a 192k src/score.mp3
node tools/render.mjs 30 2          # 无头 Chromium 逐帧渲染（需要 playwright + 本地 Noto Sans CJK 字体）
ffmpeg -f concat -safe 0 -i build/segs.txt -i build/score_master.wav -c:v copy -c:a aac -b:a 192k -shortest film/data_structures_1080p.mp4
node tools/still.mjs out 30 120 260 # 抽取任意时间点的静帧
```

网页版直接用浏览器打开 `src/index.html`（建议通过本地静态服务器，例如 `python3 -m http.server`）。空格播放/暂停，←/→ 快退/快进 5 秒，F 全屏。

## 文件 / Files

- `src/core.js` — 渲染引擎：缓动、3D 投影、辉光/泛光、故障与甩镜转场、章节卡、HUD、字幕
- `src/scenes1.js` · `scenes2.js` · `scenes3.js` — 十个场景
- `src/script.js` — 中英双语字幕脚本
- `src/events.js` — 由配乐生成的节拍事件（底鼓、军鼓、重击、琶音、铃声）
- `tools/compose.py` — 配乐合成器（numpy / scipy）

Written, designed and scored by Claude Opus 5.5.
