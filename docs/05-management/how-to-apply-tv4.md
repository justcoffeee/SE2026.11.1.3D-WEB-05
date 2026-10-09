# Cách dùng bộ scaffold + TV4 UI prototype

## Trên Windows PowerShell (ưu tiên)

1. Tải hai file `SE2026-TV4-week1.zip` và `SETUP-TV4-WINDOWS.ps1` vào **cùng một thư mục**.
2. Mở PowerShell tại thư mục đó, chạy `git --version` và `node --version` (Node >=22.16).
3. Chạy lệnh dưới (chỉ áp dụng cho script bạn đã đọc và tin cậy):

```powershell
powershell -ExecutionPolicy Bypass -File .\SETUP-TV4-WINDOWS.ps1
```

Script sẽ clone repo nếu chưa có, kiểm tra workspace sạch, kiểm tra xung đột file, tạo nhánh `feat/tv4-week1-ui-ux`, chép scaffold. **Không tự commit hay push**.

Nếu script dừng do xung đột file: repo có code mới hoặc README khác. **Không xóa/ghi đè**; trao đổi TV1 và merge thủ công.

## Thủ công (macOS / Linux / Git Bash)

```bash
git clone https://github.com/justcoffeee/SE2026.11.1.3D-WEB-05.git
cd SE2026.11.1.3D-WEB-05
git switch -c feat/tv4-week1-ui-ux
# Giải nén nội dung ZIP vào thư mục repo; kiểm tra file trùng trước khi ghi đè.
npm install
npm run dev
```

## Kiểm thử và tạo PR

```bash
npm run typecheck
npm test
npm run build
git status
git add .
git commit -m "feat(tv4): add week-1 UI prototype and UX docs"
git push -u origin feat/tv4-week1-ui-ux
```

Mở PR tại GitHub từ branch `feat/tv4-week1-ui-ux` vào nhánh TV1 yêu cầu. Không push thẳng vào `main`.

## Nếu không có quyền push

Fork repo về tài khoản của bạn, tạo nhánh trên fork rồi mở PR về repo nhóm; hoặc xin TV1 cấp quyền Collaborator.
