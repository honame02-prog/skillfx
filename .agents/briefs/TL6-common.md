## Bối cảnh chung (Tịnh Liên Yêu Hoả — bản HOÀN CHỈNH, chia phần)
- Kịch bản: D:/SkillFX_TuThienChi_HoaLien/design/di-hoa/05-tinh-lien-yeu-hoa.md — đọc mục "v2", "v3 nháp", "v4" (bỏ v1). Nháp v4 (commit bce32db) ĐÃ ĐƯỢC NGƯỜI DÙNG DUYỆT: giữ nguyên bố cục, nhịp, dáng lớn; việc của bạn là làm CHI TIẾT + SẠCH + NHANH hơn, không thiết kế lại.
- Chiêu = khung `src/fx/di-hoa/tinh-lien.js` (Opus giữ) + `_tinhlien-common.js` (mốc thời gian, bảng màu, openAt/eyeK/lockAt/pupilW/pulses, grid; KHÔNG SỬA) + 5 phần `_tinhlien-{sky,gaze,lotus,blast,end}.js`. MỖI VIỆC CHỈ SỬA ĐÚNG FILE TRONG write_scope. Hằng mới khai trong file của bạn.
- Giao diện cố định: các hàm export hiện có giữ nguyên tên/chữ ký (`sky/gaze/lotus/blast(p, t, layer)`, `ending`, `reveal`). Stateless, tất định theo t (hash theo chỉ số, không Math.random). Memo thuần theo khoá (như darkRuns) được phép.
- Phong cách: Dị Hoả = nhiều màu, mềm, xoáy. Tịnh Liên: lửa TRẮNG TINH (L[5..6]) viền vàng nhạt (L[3..4]), chân vàng ấm (L[2]); nâu viền L[0] 1 px khi trắng nằm trên nền sáng. Mắt: tím than (LID), tròng hổ phách (IRIS), con ngươi khe dọc (PUPIL), vân đỏ (VEIN). Bụi: DUST (nâu đất dưới, xám tro trên).
- LUẬT PIXEL: KHÔNG dùng alpha < 1 trên p.dot/p.put/p.shade-tô-đặc/p.line (gây lấm tấm). Muốn mờ thì dùng ánh cộng sáng `p.shade` với o.l + o.k (như beam hiện có) hoặc chọn màu tối hơn trong bảng / dither có trật tự theo lưới (không hạt ngẫu nhiên lẻ tẻ). Tránh viền đen cứng quanh mọi khối; tránh khối tròn cùng cỡ xếp hàng (trông như chùm nho/hạt châu).
- HIỆU NĂNG: cả chiêu phải `node tools/gate.mjs di-hoa/tinh-lien` PASS (trung vị ≤ 5 ms, p95 ≤ 16 ms). Hiện FAIL (9,2/20 ms). Đo riêng phần của bạn bằng script tạm đặt trong `records/` (đã gitignore), mẫu:
  ```js
  import { createFrame, clearFrame, painterFor } from '../src/core/index.js';
  const { sky } = await import('../src/fx/di-hoa/_tinhlien-sky.js');
  const f = createFrame(640, 420), mk = () => { clearFrame(f); const p = painterFor(f); p.place(160, 380, false, 0); p.fade = 1; p.lightK = 1; p.layer = 'back'; return p; };
  // 3 lượt khởi động, rồi đo performance.now() quanh sky(mk(), i/30, 'back') với i = 0..234; in trung vị / p95 / max
  ```
  Ngân sách của từng phần ghi trong brief riêng. Số đo khi 4 việc Codex chạy song song bị thổi phồng (LESSONS 17/11): báo cả số đo module lẫn số gate, Opus sẽ đo lại trên nhánh chính.
- Kiểm: `node tools/gate.mjs di-hoa/tinh-lien --at <mốc trong brief>` → xem `records/gate/di-hoa-tinh-lien/strip.png` (tối đa 3 vòng, mỗi vòng sửa chỗ xấu nhất ở phần của bạn). Các phần khác vẫn là bản v4: bỏ qua chúng.
- Thời gian: ≤ 15 phút. KHÔNG: sửa file ngoài write_scope (đặc biệt `src/fx/ultimate/`, `_tinhlien-common.js`, `tinh-lien.js`, core); tạo GIF/MP4; đổi act/nhịp/mốc thời gian.
