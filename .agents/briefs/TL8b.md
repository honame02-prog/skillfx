goal: Vòng 3 PHẦN KẾT + ÁNH DƯƠNG + BỤI: các phục hồi nhỏ, cụ thể (trạng thái hiện tại commit 72e9fb4). Giữ nguyên mọi thứ đã giàu hơn v4.
sửa (theo chấm Codex TL7r + Opus đã xem):
1. `_tinhlien-end.js` ~5.2–5.8 (cột xoắn): phục hồi TRỤC SÁNG TRẮNG ở lõi cột như v4 (lõi L[5..6] rộng 2–4 px chạy từ chân lên con ngươi), giữ các dải xoắn sáng + bụi hiện có; chân cột đang lộ mẫu caro/ô cờ (khoảng y 0..-20) → rã mép bằng cụm bụi nhỏ, không caro.
2. `_tinhlien-end.js` sau 5.9: thêm gợn elip sáng lan từ chân mục tiêu (L[6]→L[2]) đến 6.2 như v4.
3. `_tinhlien-gaze.js` ~3.0–3.4: vết nứt chân mục tiêu có lõi trắng L[6] và mép L[3]; số đá treo lơ lửng trả về 16 (đang 12).
4. `_tinhlien-blast.js`: 3.42 tách đĩa chớp đặc thành 2 vòng xung kích phân biệt; giữ loé chân L[3..6] kéo dài tới ~3.8; sóng bụi sát đất ~4.9 bỏ mép răng cưa đều → cuộn DUST[1..3] lệch cỡ.
hiệu năng: gate cả chiêu PASS; mỗi file không tăng p95 quá 1 ms.
write_scope: src/fx/di-hoa/_tinhlien-end.js src/fx/di-hoa/_tinhlien-gaze.js src/fx/di-hoa/_tinhlien-blast.js
done_when: `node tools/gate.mjs di-hoa/tinh-lien --at 0.65,1.1,1.7,2.3,2.9,3.2,3.42,3.8,4.3,4.9,5.5,5.85,6.3,7.0,7.6` GATE PASS; tự so strip với D:/SkillFX_TuThienChi_HoaLien/skillfx/records/gate/compare/v4.png ở các ô 3.2, 3.42, 3.8, 4.9, 5.5, 6.3. Thời gian ≤ 12 phút: làm 1 → 2 → 3 → 4.
Đọc: .agents/briefs/TL7-common.md, TL6-common.md.
