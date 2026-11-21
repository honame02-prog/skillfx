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

## VL2b — 90 khung, ba lớp và kiểm liên tục

Mục này thay phần mô tả chuyển động/bung của VL2a2. `build.py --all` chỉ đọc nguồn và rig hiện tại, xuất `frames/{floor,back,front}/000..089.png`, GIF, bảng lớp và continuity; không gọi dịch vụ. `motion.py` là bước biên soạn nguồn/chuyển động, chỉ chạy khi muốn tái tạo rig VL2b. `rig-vl2a2.json` giữ nguyên đầu vào trước sửa. Không chạy `prepare.py` sau đó vì nó tái tạo bản A.

**Hai sửa hình:** (1) Thay burst-A/B/C bằng ba vùng cuộn thực từ `VL1/gen-k4.png`, ghi polygon, gốc và tỉ lệ trong rig; loại màu tối ở gốc để không mang áo/da nhân vật vào nguồn. Giữ mép ngà/hồng, lòng rỗng, nở mép 1 px bằng màu kề. Tám gốc cùng ở ngực (120,112), chiếu Y 0,85 thay 0,5, bung nhanh từ khung 67; k4 có bbox lửa 153×143 px, vòng sàn rộng 122 px. Không còn tám mảnh nhỏ rải trên vòng sàn. (2) Gộp 32 pixel trắng thuộc cụm 1–2 px ở sáu nguồn inhale/pressure vào màu mép kề sẵn có; không thêm màu, không dither hay alpha mềm. Lọc alpha cụm <3 px cũng được áp dụng nhưng các nguồn này không có cụm alpha nhỏ cần bỏ. Affine nearest vẫn có thể tạo đầu nét 1 px; không tuyên bố mọi mép đều dày đúng 2–3 px.

**Chuyển động:** lửa hút đi vào trong 9 khung thay vì bật đủ kích thước; đổi nguồn hút/ép đúng mốc 33, nội suy footprint và vị trí. Nhịp ở 39/50/61 (1,3000/1,6667/2,0333 s), diện tích tâm đục tương ứng 78/84/108 px so với 52 px khi không pulse. Tám lưỡi giữ ID tới 88, thu nhỏ liên tục rồi tắt ở 89. Lượt đầu phát hiện năm lưỡi mất ở 88 do affine co dưới pixel; đã nâng kích thước cuối pha, không nới ngoại lệ kiểm. Căn lại vị trí tâm theo centroid alpha thực sau nearest; không chỉ đo pivot ghi trong rig.

**Số đo kiểm toàn bộ:** 270/270 PNG, 240×220, alpha chỉ 0/255, không pixel ngoài bảng; cả ba lớp khung 89 trống; mọi bbox nằm trong canvas. PNG trên đĩa khớp render; hash của đủ 16 nguồn khớp rig. Trôi centroid tâm tối đa **1,4020 px/khung**, 0 đổi số lưỡi ngoài mốc. Chênh RGBA tối đa **18,5341% diện tích canvas**; biến đổi lớn nằm trong pha bung/rã. `continuity.json` ghi đủ 90 khung/89 chuyển tiếp, % chênh, centroid, số lưỡi, sinh/mất theo ID. Số lưỡi là số instance nguồn thực sự render không trống, không phải số connected component vì các cuộn giao nhau tại ngực. Các mốc chuyển pha được phép là 10/33/67/77/89.

**Xem trước:** GIF 720×660 (3× nearest), 90 khung, 883327 byte, lặp vô hạn, tổng 3000 ms. GIF chỉ có đơn vị delay 10 ms nên dùng chu kỳ 30/30/40 ms, trung bình đúng 30 fps; không tuyên bố mỗi khung là 33,333 ms. Bảng `preview-layers.png` có hàng floor/back/front/ghép và đủ tám cột yêu cầu. Nhân vật chỉ ghép trong preview từ `daosi.png` ô `walk_down_right_00`; các PNG lớp chỉ có FX.

**Tự chấm và giới hạn xem:** đã mở đủ bốn hàng bảng lớp và giải mã chính GIF thành ba bảng liên tiếp, rà **90/90 khung** (`gif-review-inhale/pressure/burst.png`). Dáng bung **4/5**: bông cuộn lớn đọc rõ, vượt vòng sàn, cùng tâm ngực; nguồn lặp ba biến thể vẫn có tính đều. Nhịp tim **3/5**: ba đỉnh tăng dần có số đo, nhịp ba đọc rõ hơn nhịp đầu. Liên tục qua dải khung **3/5**: hút vào/rã ra đều; đổi silhouette ở 33 vẫn dứt. **Chưa tự xác nhận độ mượt khi phát GIF thời gian thực**: CUA lỗi khởi tạo hai lần, node_repl báo `invalid sandbox permission path: 'file:///D:' is invalid on 'windows'`. Không đánh đồng xem dải khung với xem phát động. Đây là phần còn thiếu để nghiệm thu đầy đủ tiêu chí xem GIF; không thử sửa hình thêm sau lượt rà cuối.

```text
python exp/VL2/build.py --all --out exp/VL2/frames
PASS continuity: 89 transitions; heart drift max 1.4020px; unplanned tongue changes 0
PASS preview: 90 frames; 720x660; 3000ms; loop=0; GIF 883327 bytes
PASS build: 90 frames x 3 layers = 270 PNG; 240x220; binary alpha; palette OK; character excluded
```

Ghi nhận vận hành: lệnh thống kê cuối lỗi quote ở `python -c`, sau đó đọc log gặp UTF-16 do `Tee-Object` PowerShell 5.1. Đã dùng here-string truyền script và chuẩn hoá hai log về UTF-8; không ảnh hưởng kết quả dựng hình. Khi ghi/đọc log tiếp theo chỉ định encoding, tránh nhúng quote nhiều tầng.


## VL2a2 — giữ ngôn ngữ hình VL1

Mục này thay mô tả nguồn và tự chấm VL2a ở trên. Không gọi ImageGen mới (0 vòng sinh); dùng phương án cắt trực tiếp được brief cho phép. `prepare.py` tái lập các mảng từ `VL1/gen-k2.png` và `gen-k3.png`. Polygon chỉ chọn vùng ảnh không người, không vẽ đường lửa. Giữ 4 tâm nhỏ của VL2a.

1. **Bỏ gai/tinh thể:** thay toàn bộ inhale/pressure/burst A/B/C bằng nét cong, lòng rỗng, ngà/hồng của VL1. Chỉ nở alpha 1 px theo 4 hướng, lấy màu mép kề sẵn có; không tô viền xám mới, không dither hay alpha mềm. Cụm mép sáng nhìn ở 1× khoảng 2–3 px; một số đầu cong còn 1 px, chỗ giao nét rộng hơn. Không khẳng định mọi mép đều 2–3 px.
2. **Sàn nhẹ:** cả hai nguồn floor lấy vòng elip đứt VL1 k3, giữ lòng rỗng, bỏ đĩa đỏ. Sóng k4 có đúng 1 instance `ground`. Nét ngà nguồn 100×50 có trung vị đoạn chạy ngang 2 px; ở k4 phóng 1,66× có chỗ 3–4 px. Không nở thêm sàn. Forward-nearest giữ các cực trị alpha mà inverse-nearest có thể bỏ sót, không nội suy màu.
3. **Người đọc rõ:** giảm nguồn inhale từ 46×72 xuống khoảng 33–37×61, pressure từ 35×47 xuống 25–31×42–48; đưa lưỡi gần lệch trái, bớt xoay. k2 front che 18/675 pixel người (2,67%); k3 che 86/675 (12,74%, gồm tâm). k4 đúng 8 lưỡi hướng toả, chiếu Y 0,5, cùng họ cong VL1.

### Số đo

`edge≥2×2` là tỷ lệ pixel biên alpha thuộc cụm 2×2 đục, không đo bề dày vuông góc. Dải ngà nguồn có trung vị đoạn chạy ngang 1–2 px, phần hồng kề bên làm cả cụm dày hơn. Không dùng số % này để tuyên bố đồng loạt 2–3 px. `verification.json` lưu số đo bổ sung và cách tính. Footprint sàn đúng 2:1 ở 89/89 khung có sàn; khung 89 trống.

| Mốc | edge≥2×2 | H/W sàn | Pixel người bị front che | Độ phủ alpha trong bbox sàn |
|---|---:|---:|---:|---:|
| k1 | 69,23% | 0,5000 | 18/675 | 9,18% |
| k2 | 90,64% | 0,5000 | 18/675 | 6,40% |
| k3 | 94,64% | 0,5000 | 86/675 | 7,44% |
| k4 | 83,57% | 0,5000 | 130/675 | 6,36% |
| k5 | 0,00% | 0,5000 | 2/675 | 9,18% |

### Tự chấm bằng mắt

Đã mở `comparison-2x.png` (VL1 trên / VL2a2 dưới), bản 1× và bảng lớp. **Cùng ngôn ngữ VL1: có, 4/5**: đường cong cuộn, lòng rỗng, mép ngà/hồng; sàn nhẹ, người rõ. So với VL1, mép dày hơn và k4 chia 8 cuộn rời rõ hơn; nét nối tâm thưa hơn VL1. Đây là tự chấm phần A, chưa phải người dùng nghiệm thu. Affine nearest vẫn tạo bậc pixel ở đường chéo; chưa kiểm hoạt hình liên tục hoặc atlas/game phần B.

Đã kiểm 16/16 nguồn, 90/90 khung, 5/5 keys và 15/15 PNG lớp. `rig.json` ghi crop, nguồn và SHA256; hai ảnh so sánh đã dựng lại. Lệnh thống kê phụ từng lỗi cú pháp import, đã sửa; ghi chú mới từng mất dấu qua pipe PowerShell, đã sửa bằng ghi UTF-8 trực tiếp. Tài nguyên không bị ảnh hưởng.

```text
python exp/VL2/build.py --frames 6,25,50,72,85 --out exp/VL2/test
PASS build: 5 frames x 3 layers = 15 PNG; 240x220; binary alpha; palette OK; character excluded
```
