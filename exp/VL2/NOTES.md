# VL2a — Tâm lô rỗng: nguồn và khung chuyển động

Phạm vi phần A: chuẩn bị nguồn ImageGen, rig 90 khung và năm mốc duyệt. Hướng VL1 đã được người dùng duyệt theo brief hiện tại; đây chưa phải bản hoạt hình hoàn chỉnh hay atlas runtime của phần B. Mọi tệp ghi trong `exp/VL2/`; `exp/VL1/` và runtime chỉ đọc.

## Nguồn hình và tái lập

- **1 lần sinh**, built-in `image_gen.imagegen`, không sinh lại, không API/CLI. Prompt nguyên văn: `prompt-01.txt`; bản sinh gốc giữ nguyên ở `gen-01.png` (1254×1254 thực tế, khác 1024×1024 yêu cầu trong prompt). Bộ cắt dùng tỉ lệ 4×4 theo kích thước thực, không giả định 256 px/ô.
- Một atlas cùng bộ nét/camera, hoàn toàn không có người: 9 mảng A/B/C × hút/ép/bung; 4 cỡ tâm hoả; 1 vòng sàn; 1 sóng sàn; 1 mảnh dư âm. `src/` chứa 16 PNG RGBA **240×220**, neo chân chung **(120,144)**. Lưỡi neo gốc ở **(120,116)**, tâm ở **(120,112)**. Manifest trong `rig.json` ghi crop nguồn, anchor, bbox, native size và SHA256 từng nguồn.
- `prepare.py` chỉ tách alpha cứng ở 180, bỏ thành phần nhiễu nhỏ hơn max(12 px, 2,5% mảng lớn nhất), cắt và co nearest, lượng tử nearest RGB. Không vẽ lửa/ellipse bằng mã; không dilation, không dither, không crossfade. Dùng nguyên `quantization_rgb` của `exp/VL1/palette.json`: dải vanlac cùng trắng và màu neo đã có trong bảng. Các khoảng trống của lửa có alpha 0, nét có alpha 255; không dùng nền đen làm màu trong suốt giả.
- Vòng sàn/sóng lấy trực tiếp hai ô cuối từ ảnh sinh, chỉ co riêng X/Y để footprint đúng 2:1. Cắt bbox alpha nguồn trước khi resize, đặt kích thước nguyên từ scale trong rig; không cắt hình theo đường ellipse do mã dựng.
- `build.py` không gọi ImageGen. Mỗi phần dùng nguồn + anchor + vị trí + xoay + scale + hệ số chiếu; affine NEAREST. Lớp sàn dùng resize riêng để bảo toàn chính xác footprint. `prepare.py` tái lập nguồn/rig/keys/biên bản; **chạy lại sẽ ghi lại các tệp VL2 do nó tạo**, nên phần B chỉ gọi `build.py` khi muốn giữ rig đã chỉnh.

## Rig và lớp

90 mục khung, 30 fps, khoảng trình chiếu [0,3) giây. Mỗi mục có phase, thời gian, pulse, events, floor_width và danh sách parts. Mỗi part ghi ID ổn định, source, position, rotation độ, scale XY, layer, ground_y và projection_y. Tâm cũng là một part, cỡ thể hiện bằng source và scale.

Pha: 0–9 tâm/dấu; 10–32 hút A/B/C; 33–66 ép A/B/C; 67–76 bung 8 lưỡi; 77–88 rã; 89 không có part. Ba nhịp ở **39 / 50 / 61** ứng với **1,30 / 1,67 / 2,03 s** theo lưới 30 fps (thời gian thực 1,3000 / 1,6667 / 2,0333 s). Pulse mạnh dần 0,20 / 0,30 / 0,42. Hit duy nhất tại **72 = 2,40 s**.

Quy tắc: `back` khi **điểm neo trên mặt sàn** có y < 144; `front` khi y ≥ 144; `floor` độc lập. Không xét y của ngọn lửa đang vươn cao để đổi lớp. Lưỡi bung chiếu Y ×0,5, gốc tiến ra ngoài theo hướng toả; có đúng 8 instance, luân phiên 3 mảng nguồn. Chỉ có **một** instance sóng sàn chính ở k4.

Ảnh xem trước ghép đúng `floor → back → nhân vật → front`. Nhân vật lấy frame `walk_down_right_00` từ atlas tham chiếu được brief chỉ định, crop theo JSON, cao 57 px, neo chân (120,144); **chỉ** hàm preview gọi `reference()`. PNG lớp không chứa người. Màu nhân vật tham chiếu được giữ nguyên trong preview; phép kiểm palette áp dụng nguồn FX và các lớp FX, không áp lên nhân vật tham chiếu.

## Tự chấm ba nhận xét

Phép đo mép: pixel đục có ít nhất một láng giềng 4 hướng trong suốt là pixel mép. Tính % pixel mép cùng thuộc ít nhất một khối **2×2 toàn đục**. Đây là phép đo độ kết cụm, không đồng nghĩa mọi nét đều dày đúng 2–3 px. Số trên key đo riêng `back+front`, không lẫn nhân vật hoặc vòng sàn.

| Mốc | Khung | Mép thuộc cụm ≥2×2 | H/W vòng sàn | Tự chấm |
|---|---:|---:|---:|---|
| k1 | 6 | 69,23% | 0,5000 | Tâm nhỏ có gốc chắc; chưa có lưỡi ngoài đúng nhịp mở đầu |
| k2 | 25 | 87,81% | 0,5000 | Mép/gốc lưỡi dày rõ so với VL1; còn ngọn 1 px để tưa lửa |
| k3 | 50 | 89,49% | 0,5000 | Ép vào quanh tâm, gốc dày hơn đầu; khoảng âm vẫn xuyên nền |
| k4 | 72 | 81,23% | 0,5000 | Đúng 8 lưỡi hướng ra, ít nét cuộn lồng; 1 sóng sàn đọc rõ |
| k5 | 85 | 0,00% | 0,5000 | Chỉ tâm/mảnh tắt cực nhỏ; không lấy dư âm 1 px làm chuẩn độ dày lửa chính |

Nguồn lưỡi trước ghép: hút A/B/C **90,32 / 91,04 / 89,93%**; ép **91,67 / 92,22 / 91,67%**; bung **89,32 / 87,02 / 85,71%**. Những gốc lớn có mảng rộng hơn 3 px có chủ ý; không làm toàn lưỡi thành đường đều như ruy băng. Vỏ có khoảng âm alpha 0, nhưng không khẳng định mọi lưỡi là một vòng kín topo.

1. **Mép lửa: 4/5.** Đã xem nguồn, năm mốc 1×/2× và lớp riêng; mảng ngà/tím/hồng chắc hơn VL1. Đầu mảnh còn giữ để có lực tưa. Phần B cần kiểm nét nhảy khi xoay/co ở các khung giữa.
2. **Bung: 4/5.** Từ nhiều cuộn nhỏ của VL1 sang 8 lưỡi lớn, hướng tiến ra khỏi tâm và sóng sàn rõ. Hình tĩnh đã sửa cấu trúc; uy lực/tốc độ vẫn cần xem hoạt hình. Hình bung thấp, không thành cột lửa.
3. **Elip: 5/5 về footprint số đo.** Cả 5 mốc H/W đúng 0,5000; audit kiểm cả 89 khung có sàn. Đây là tỉ lệ bbox alpha của đường sàn hữu cơ, không phải phép fit conic hay chứng minh camera bằng nhận diện ảnh.

`comparison.png` là so trước/sau đúng 1×, VL1 hàng trên/VL2 hàng dưới; `comparison-2x.png` phóng nearest 2×. `layers-review.png`: năm cột tương ứng năm mốc, ba hàng floor/back/front; không có nhân vật. Keys v2 đúng 240×220, dựng từ rig và src, không lấy ảnh sinh làm key hoàn chỉnh.

## Kiểm đã đi và phần B còn lại

Đã đi: đọc đủ 16 nguồn; render kiểm 90/90 khung trong bộ nhớ, palette/alpha/kích thước/lề/lớp; kiểm khung 89 sạch; dựng 5 keys; xuất 15 PNG lớp theo lệnh brief. `verification.json` lưu bbox mọi khung, metric nguồn và key. Không xuất bộ 270 PNG trong phần A.

Phần B: xuất 90×3 PNG/atlas; xem chuyển động liên tiếp trên nền sáng/tối và cùng mục tiêu thật; rà thay source ở 32→33, 66→67, 76→77 và đổi lớp; bổ sung breakdown nếu gãy mép; sửa chuyển pha/nhịp cháy trước khi chốt. Rig hiện cho phép kiểm từng frame, chưa tuyên bố chuyển pha mượt hoặc kiểm trong engine/FPS. Không đo hiệu năng máy ở phần này.

Lệnh kiểm theo brief:

```text
python exp/VL2/build.py --frames 6,25,50,72,85 --out exp/VL2/test
PASS build: 5 frames x 3 layers = 15 PNG; 240x220; binary alpha; palette OK; character excluded
```

Ghi nhận vận hành: lệnh thống kê cuối lỗi quote ở `python -c`, sau đó đọc log gặp UTF-16 do `Tee-Object` PowerShell 5.1. Đã dùng here-string truyền script và chuẩn hoá hai log về UTF-8; không ảnh hưởng kết quả dựng hình. Khi ghi/đọc log tiếp theo chỉ định encoding, tránh nhúng quote nhiều tầng.
