goal: Lắp `_tinhlien-dust-lib.js` vào `src/fx/di-hoa/_tinhlien-blast.js` (nón bụi, vương miện, bụi sát đất; BOOM 3.4 → INHALE).
1. Giữ bố cục/chuyển động hiện có (nón chữ V cao ~170 px, vương miện cuộn nấm, dải bụi sát đất loe hai bên, xoắn khi INHALE) nhưng VẼ bằng dustMass: chuyển các khối hiện có thành mảng blobs {x,y,r,z,seed} (khối trước z cao hơn), gọi dustMass 1–3 lần (vd. nón+vương miện một mass, bụi sát đất một mass) với top/bottom đúng để đất nâu ở dưới, tro ở trên. Bỏ cách tô từng khối cũ (viền, rãnh, đốm riêng).
2. reveal() (sen sáng trong bụi): truyền glow {x: TX, y: tâm sen ~ -60, r ~60, k theo reveal(t), c: L[6]}.
3. Tan: dùng erode tăng dần thay cho co khối; INHALE: blobs bị kéo xoắn lên như hiện tại.
4. Đá văng giữ nguyên.
write_scope: src/fx/di-hoa/_tinhlien-blast.js
done_when: gate PASS; blast() back+front p95 ≤ 6 ms, max ≤ 9 ms (dustMass tốn theo diện tích: gộp blob hợp lý, r không quá nhỏ); strip ô 3.42–5.5 bụi giống thẻ (mềm, một bề mặt, sáng trên trái, nâu→tro), không bong bóng, không giấy vò, không viền đen.
Đọc: .agents/briefs/TL9-common.md
