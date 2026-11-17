goal: CHỈ tối ưu hiệu năng `src/fx/di-hoa/cot-linh.js`, KHÔNG đổi hình ảnh. Hiện p95 15.5–18.3 ms (dao động quanh ngưỡng 16); mục tiêu p95 ≤ 11 ms, max ≤ 25 ms.
context: các khung nặng nằm ở 3.75–4.2 s (16 xương sườn iceFlame + coldFlame bám xương, mỗi lưỡi là một p.shade bbox với tìm điểm gần nhất trên 10 đoạn). Gợi ý: cache hình băng tĩnh (xương sau khi đã trồi lên xong không đổi → nướng sẵn một lần thành mảng pixel và dán), thu bbox theo phần xương còn lại, giảm số đoạn curve() cho lưỡi ngắn, tránh tạo mảng mới trong vòng lặp pixel. Nếu sửa `_cold-lib.js` thì chỉ THÊM hàm mới ở cuối, không đổi hàm cũ.
verify hình không đổi: so ảnh trước/sau ở các mốc 3.3, 3.5, 3.7, 3.85, 3.98, 4.05, 4.15, 4.5 — khác biệt ≤ 2% số pixel mỗi mốc (viết script so trong records/, không commit script).
write_scope: src/fx/di-hoa/cot-linh.js, src/fx/di-hoa/_cold-lib.js (chỉ thêm cuối)
done_when: `node tools/check.mjs di-hoa/cot-linh` không FAIL; `node tools/gate.mjs di-hoa/cot-linh` chạy 3 lần đều PASS với p95 ≤ 11; báo cáo dán 3 dòng GATE và % pixel khác ở 8 mốc.
do_not: đổi nhịp, hình, màu; sửa file khác; tạo GIF.
time: ≤ 12 phút.
