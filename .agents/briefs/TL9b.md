goal: Lắp `_tinhlien-lotus-lib.js` vào `src/fx/di-hoa/_tinhlien-lotus.js` (đoá sen ở ngực mục tiêu, APPEAR 0.6 → BOOM 3.4).
1. Thay phần vẽ cánh/đoá hiện có bằng flameLotus(p, cx, cy, size, t, {open, crush, k, layer, seed}): gốc đoá ~ dưới LC vài px sao cho đoá cao ~44–50 px lúc lớn nhất (size ~1.0–1.1), layer 'back'/'front' theo đúng lớp gọi.
2. Nhịp: APPEAR bùng nở nhanh (open 0.3→1 trong ~0.35 s, k 0→1), mỗi nấc OPENS đoá phồng nhẹ (size +6%) và sáng lên (heat qua crush nhỏ 0.1 trong 0.15 s); LOCK→BOOM: crush 0→1 (cánh khép, co, trắng chói); tại BOOM tắt.
3. Giữ các thành phần phụ hiện có (ngọn lửa nhỏ bay lên, tia lửa chỗ tia hội tụ chạm sen) nếu không mâu thuẫn; bỏ hạt lẻ lấm tấm.
write_scope: src/fx/di-hoa/_tinhlien-lotus.js
done_when: gate PASS; lotus() back+front trung vị lúc có sen ≤ 1,5 ms, p95 ≤ 3 ms; strip ô 0.65–3.2 đoá giống thẻ (cánh tròn mềm, tách cánh, kem-vàng, không nhọn).
Đọc: .agents/briefs/TL9-common.md
