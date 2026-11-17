goal: Sửa vòng 2 phần KẾT của `src/fx/di-hoa/cot-linh.js` (sau 3.2 s), tiếp tục từ trạng thái file hiện tại. Opus đã soi cận cảnh: D:/SkillFX_TuThienChi_HoaLien/deliver/di-hoa/02-cot-linh-ket-v2-soi.png (6 khung: 3.40, 3.55, 3.68, 3.85, 4.02, 4.15).
giữ nguyên: bộ xương sườn ở 3.85 (ĐẸP, đúng ý) và mọi thứ trước 3.2 s.
sửa (theo thứ tự ưu tiên):
1. 4.02 (Thiêu cốt): hiện chỉ thấy sọc trắng trên xương. Cần thấy **lửa lạnh thật bốc dọc xương**: dùng `coldFlame` (W 4–6) với pts = đoạn rib từ gốc tới mặt lửa đang chạy lên, lưỡi lửa liếm ra hai bên và chĩa lên trên; phía dưới mặt lửa xương đã tan (không vẽ xương nữa), chỉ còn lửa + bụi xương rơi. Mặt lửa chạy từ gốc lên đầu trong ~0.15 s, lệch nhịp giữa các xương. Không để mảng trắng đặc lớn.
2. 4.15: còn sót **hai đám mây trắng** ở đỉnh hai xương giữa và một vệt dọc ở giữa → xoá; sau khi lửa chạy hết, đầu xương cũng phải tan thành bụi rơi như phần còn lại. Đường "xương sống" mờ dọc ở giữa (3.85–4.15) bỏ hoặc làm mờ hẳn.
3. 3.40–3.55 (mảnh treo): mảnh đang là các nét gạch lộn xộn + chấm nối → làm thành **mảnh băng có hình** (tam giác/đa giác nhỏ 4–7 px, mặt cắt 2 tông sáng/tối như iceFlame, viền sáng phía trên-trái), ít hơn (16–20 mảnh), treo rải quanh mục tiêu, xoay chậm; sợi linh tuyến nối là đường cong mảnh 1 px liền (không chấm chấm), màu C[4], chỉ nối các mảnh gần nhau.
write_scope: src/fx/di-hoa/cot-linh.js
done_when: `node tools/check.mjs di-hoa/cot-linh` không FAIL; `node tools/gate.mjs di-hoa/cot-linh --at 3.4,3.55,3.68,3.85,3.98,4.05,4.15,4.4` PASS; tự xem strip 2 vòng.
do_not: sửa trước 3.2 s; đổi nhịp; sửa file khác; tạo GIF.
time: ≤ 10 phút.
