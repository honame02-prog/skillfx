goal: Sửa MẮT/TRỜI trong `src/fx/di-hoa/_tinhlien-sky.js`: khôi phục và vượt v4 (chấm so sánh: ĐƠN GIẢN HOÁ, P1).
lỗi đã chấm (ô 2.3 và 0.67–5.72): mắt bị dẹt, mất độ vồng của khe mắt; MẤT vành lửa ở hai mí; tròng to hơn nhưng vân thành SỌC NGANG; bóng tối (darkness) lộ lưới kẻ ô. Mây thêm tông và vết rách thêm nhánh là tốt — giữ.
sửa:
1. Dáng khe mắt: phục hồi độ vồng như v4 (độ mở theo EH=30 × openAt, mí trên cong vồng lên rồi sụp ở khoé ngoài), giữ bất đối xứng mới (mí trên dày, khoé ngoài nhọn hếch, khoé trong tròn) nhưng KHÔNG dẹt.
2. Vành lửa: hai dải lửa L[2..5] ôm mí trên và mí dưới như v4 (đầy đủ, liên tục, bập bùng), lưỡi to ở khoé ngoài nhỏ dần vào trong, hút ngược vào mắt; thêm tàn lửa xoáy về con ngươi.
3. Tròng: vân IRIS toả TỪ TÂM (sợi hướng tâm, sáng tối xen kẽ, quầng đỏ VEIN quanh con ngươi, viền ngoài tối), không sọc ngang; giữ đốm ướt; khoá → con ngươi giật co, tròng rực IRIS[4].
4. Bóng tối: bỏ mẫu lưới/kẻ ô; dùng dải tông tối liền theo bán kính/khoảng cách từ mắt, chuyển tông bằng mép dither 1–2 px không thành lưới thấy được.
5. Mây: thêm nếp cuộn CLOUD (xoắn ốc mềm về phía mắt), như Thanh Liên v3.
6. Mắt sập 5.72–5.9: giữ dáng mí cho tới cú sập (không thu thành một nét sớm).
write_scope: src/fx/di-hoa/_tinhlien-sky.js
done_when: gate PASS với mốc trong TL7-common; sky() trung vị ≤ 2,5 ms, p95 ≤ 5 ms; strip không ô nào nghèo hơn v4.png ở phần mắt/trời.
Đọc: .agents/briefs/TL7-common.md, TL6-common.md, TL6a.md.
