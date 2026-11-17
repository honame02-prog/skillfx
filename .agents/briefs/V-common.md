## Bối cảnh chung (Vẫn Lạc Tâm Viêm — chi tiết, chia phần)
- Kịch bản: D:/SkillFX_TuThienChi_HoaLien/design/di-hoa/03-van-lac-tam-viem.md (đọc phần v2 cuối file). Nháp đã duyệt: src/fx/di-hoa/van-lac-draft.js.
- Chiêu = khung `src/fx/di-hoa/van-lac.js` (Opus giữ) + con xà (`_serpent-lib.js`, Opus giữ) + 3 phần, mỗi phần một file, MỖI VIỆC CHỈ SỬA ĐÚNG FILE PHẦN CỦA MÌNH.
- Giao diện cố định: `export function <tên>(p, t, layer)` — layer 'back' | 'front'; KHÔNG trạng thái (stateless), tất định theo t (hạt = công thức theo chỉ số + hash, không Math.random, không biến toàn cục thay đổi).
- Dữ liệu chung: `src/fx/di-hoa/_vanlac-common.js` (C ramp 7 màu hồng: 0 tối … 6 trắng; RIM/SHADE xám trong; ASH; mốc thời gian; CHEST = ngực mục tiêu [151,-30]; hand(t); headAt(t)). KHÔNG sửa file này; cần hằng mới thì khai trong file phần.
- Ngôn ngữ hình: lửa **gần vô sắc** — trong suốt, chỉ thấy viền sáng (RIM, alpha ≥ 0.8 vì alpha thấp bị vẽ thành chấm lấm tấm) và **ánh cộng sáng** qua `p.shade` (o.l = màu, o.k = 0.08–0.3, không đặt o.c) như thấu kính; màu duy nhất là **hồng đỏ** C[2..4] (tim, mạch, đầu lửa). Không cam, không xanh. Không quầng sáng to (p.glow r > 24 hoặc k > 0.35), không chớp toàn màn.
- Xem `_serpent-lib.js` để học cách vẽ "thuỷ tinh": viền opaque + lòng cộng sáng (o.l/o.k).
- Hiệu năng: cả chiêu phải `node tools/gate.mjs di-hoa/van-lac` PASS (trung vị ≤ 5 ms, p95 ≤ 16 ms); phần của bạn nên ≤ 4 ms ở khung nặng nhất. Dùng p.shade một lượt cho mảng; tránh p.poly mảng lớn.
- Thời gian: việc nhỏ, mục tiêu ≤ 12 phút. Xem strip 2 vòng, mỗi vòng sửa chỗ xấu nhất.
- KHÔNG: sửa file khác ngoài write_scope; tạo GIF/MP4; đổi act/nhịp.
