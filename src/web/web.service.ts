import { Injectable } from '@nestjs/common';

@Injectable()
export class WebService {
  getWithdrawPageHtml(): string {
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>회원 탈퇴</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 400px; margin: 100px auto; padding: 20px; }
        .container { border: 1px solid #ddd; padding: 30px; border-radius: 8px; }
        h2 { text-align: center; color: #333; }
        input { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; }
        button { width: 100%; padding: 12px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #c82333; }
        .success { color: #28a745; text-align: center; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h2>회원 탈퇴 요청</h2>
        <form id="withdrawForm">
            <input type="text" id="userId" placeholder="사용자 아이디" required>
            <input type="password" id="password" placeholder="비밀번호" required>
            <button type="submit">탈퇴 요청</button>
        </form>
        <div id="message"></div>
    </div>

    <script>
        document.getElementById('withdrawForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const userId = document.getElementById('userId').value;
            const password = document.getElementById('password').value;
            
            if (userId && password) {
                document.getElementById('message').innerHTML = 
                    '<div class="success">삭제요청이 완료되었습니다.</div>';
                document.getElementById('withdrawForm').style.display = 'none';
            }
        });
    </script>
</body>
</html>`;
  }
}
