# VL1 — Vẫn Lạc Tâm Viêm: Tâm lô rỗng

## Ý tưởng
Một tâm hoả hồng cháy bên trong ngực mục tiêu, hút những lưỡi lửa gần vô sắc vào một lò rỗng quanh thân, ép thành ba nhịp rồi phá ra thành sóng lửa ngang.

Đây là thẻ khái niệm vòng 1, chờ duyệt hình; chưa phải atlas hoạt hình dùng trong game. Đạo sĩ ở xa là người ra chiêu; người đứng trong hình là mục tiêu nhận chiêu, không vận công hay chạy tới.

## Khuôn game và hình khối
- 240×220 px, mục tiêu khoảng 57 px, neo chân dự kiến (120, 144). Camera trực giao 3/4 chếch 30°, thấy đỉnh đầu và vai; các vòng sàn có chiều cao bằng 0,5 chiều rộng. Mục tiêu nhìn đông nam để tránh cảm giác chính diện.
- Dáng nhận diện: **ba lưỡi lửa rỗng cuộn vào một tâm**, sau đó bung thành **vành xé ngang thấp**. Không động vật, đầu rồng, sừng, hoa sen, cột lửa hoặc tim biểu tượng ♥.
- Vỏ lửa có mép ngà sáng, mép trong xám tím, vài đường gân hồng; phần giữa là khoảng trống lớn. Khối lửa cong mềm, đầu lưỡi tưa ít nhánh, không làm thành gai tinh thể. Ba lưỡi không soi gương hoàn toàn, tránh cảm giác huy hiệu.
- Tâm hoả là đốm lửa méo, gốc chắc, có ngọn nhỏ; khoảng 3–9 px trong các nhịp, không khoét rỗng lõi. Mạch hồng từ ngực xuống thân nhấn nguồn nhiệt nằm bên trong.
- Dấu sàn mảnh và đứt, không lấn át tâm. Khi nổ, bán kính sàn tối đa khoảng 103 px, chiều sâu 51 px; sau lưng đi ở back, lưỡi trước che chân ở front.

## Nhịp — 3,0 s, 90 khung ở 30 fps
| Giây / khung | Câu chuyện | Lớp |
|---|---|---|
| 0–0,33 / 0–9; k1=0,20 | Một đốm cháy trong ngực trước khi có lửa ngoài; vòng sàn đứt vừa đủ báo đòn. | floor: dấu sàn; front: tâm + 2 mạch ngắn; back: trống |
| 0,33–1,10 / 10–32; k2=0,85 | Ba lưỡi thuỷ tinh cuộn vào ngực, bao quanh mục tiêu nhưng để lòng rỗng. Lửa có nguồn ở tâm, không trồi thành rắn từ đất. | floor: vòng ấn rộng; back: lưỡi xa sau vai; front: lưỡi gần trước bụng, tâm |
| 1,10–2,23 / 33–66; k3=1,65 | Lò co vào, tâm đập tại 1,30 / 1,67 / 2,03 s, mạnh dần. Mạch nung lan trên áo, mép vỏ bị kéo vào tim lửa. | floor: gợn 3 nhịp; back: lửa sau vai; front: tâm, mạch, mép lửa trước gối |
| 2,23–2,57 / 67–76; k4=2,40 | Tâm vỡ áp, sóng xé ngang phóng ra 10 lưỡi lửa rỗng. Đỉnh sát thương ở khung 72; tuyệt đối không kết bằng cột. | floor: ellipse xung kích; back: nửa xa của lửa; front: chớp tâm, nửa gần, lửa phủ chân |
| 2,57–3,00 / 77–89; k5=2,85 | Vỏ lửa rã thành vài dải cong, tâm là thứ tắt cuối cùng. Khung 89 phải trong suốt hoàn toàn. | floor: vòng đứt tan; back/front: mảnh vỏ tan; front: tâm nhỏ tắt ở 2,97 |

Ảnh k5 lấy trước lúc tắt để thấy dư âm; nó không thay cho khung sạch cuối chiêu. Các mốc ảnh là định hướng, ba nhịp và động tác thực cần kiểm ở vòng 2.

## Bảng màu đề xuất
Giữ nguyên `tiensonv2/art/palette/tienson-fx.gpl`, chỉ đề xuất thêm **một dải `vanlac` 8 màu**, chưa sửa GPL gốc:

| Hex | Vai trò |
|---|---|
| #140c12 | Neo bóng sâu |
| #4a1428 | Hồng cháy tối |
| #64616f | Mép vỏ cháy sẫm, xám trung tính |
| #a8204a | Mạch nung |
| #ff4f7a | Tâm hồng |
| #ffb3c6 | Mép hồng sáng |
| #b9b3c4 | Mép trong thuỷ tinh |
| #efe9ee | Mép ngoài ngà |

Trắng #ffffff đã có trong GPL gốc, dùng cho điểm lõi rất ít nên không cần thêm lại vào dải mới. Cả 7 màu ramp C bản ngang vẫn có trong tập hợp cuối; hai bậc xám #64616f và #b9b3c4 giúp vỏ vô sắc có mặt trong và mép cháy sẫm mà không phải chuyển sang xanh/cam. `palette.json` lưu toàn bộ bảng gốc + dải đề xuất. Cả nhân vật minh hoạ trong keys cũng được ép vào bảng này; không dùng màu nhân vật để lách giới hạn màu. Ảnh sinh gốc được giữ nguyên, không bắt buộc đã đúng bảng.

Bản lượng tử chọn tập con trung tính/hồng gồm 8 màu trên + trắng + #14161c (có sẵn ở dải u) làm ứng viên nearest. Nhờ vậy mép nhiễm xanh của ảnh gốc không chuyển thành màu vàng của dải kim. Không dùng các dải cam/xanh khác trong keys; 10 màu ứng viên đều thuộc bảng game + dải đề xuất.

## Lửa vô hình bằng alpha 0/255
Không dùng bán trong suốt hoặc dither. Giữ các mép lửa đục thành cụm 1–3 px, phần lòng lửa là alpha 0, nhìn xuyên tới nền/nhân vật. Đổi mép sáng, khe hở và hình cong qua thời gian sẽ tạo cảm giác khí nóng. Không tuyên bố atlas có khúc xạ thật: biến dạng nền cần shader khác và nằm ngoài vòng này. Đặc biệt tách lõi tâm đục khỏi vỏ rỗng; không làm tâm hoả thành vòng tròn rỗng.

## Khác hướng cũ và lý do
Brief hiện tại cho phép tự chọn lại câu chuyện. Bỏ hai xà soi gương để tránh phải đọc hai thân chồng nhau ở cỡ nhỏ và bỏ rủi ro đầu thành rồng. Ba lưỡi lửa rỗng tạo cảm giác gần vô sắc, còn tâm và mạch nung giải thích trực tiếp việc thiêu đốt từ trong. Chuyển động chính là hút vào → nén → nổ ngang, không mượn dáng sen Thanh Liên. Giữ mức sạch pixel và cách phân lớp của Thanh Liên td v7 làm chuẩn, không sao chép hình sen.

## Tiêu chí duyệt vòng 1
Đọc được nguồn nhiệt ở ngực; không nhầm mục tiêu là người ra chiêu; góc nhìn thấy đỉnh đầu; footprint ellipse 2:1; lửa có lòng rỗng; k4 lớn hơn k2, k5 gần sạch; khung lượng tử ≤240×220, alpha 0/255 và 0 pixel ngoài bảng. Camera và cảm giác thẩm mỹ chấm bằng xem ảnh, không suy ra chỉ từ prompt hay validator.
