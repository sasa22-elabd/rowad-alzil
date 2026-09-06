<?php
require __DIR__ . '/config.php';

if (!empty($_SESSION['admin_logged_in'])) {
    header('Location: index.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $u = $_POST['username'] ?? '';
    $p = $_POST['password'] ?? '';

    if (hash_equals(ADMIN_USERNAME, $u) && hash_equals(ADMIN_PASSWORD, $p)) {
        $_SESSION['admin_logged_in'] = true;
        header('Location: index.php');
        exit;
    } else {
        $error = 'اسم المستخدم أو كلمة المرور غير صحيحة';
    }
}
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>تسجيل الدخول - لوحة تحكم رواد الظل</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: "Cairo", sans-serif; }
    body {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(160deg, #17171a 0%, #232323 100%);
        padding: 20px;
    }
    .login-box {
        width: 100%;
        max-width: 380px;
        background: #fff;
        border-radius: 14px;
        padding: 40px 32px;
        box-shadow: 0 25px 60px rgba(0,0,0,.35);
    }
    .login-box h1 {
        text-align: center;
        color: #C99643;
        font-size: 24px;
        font-weight: 800;
        margin-bottom: 4px;
    }
    .login-box p.sub {
        text-align: center;
        color: #888;
        font-size: 13px;
        margin-bottom: 28px;
    }
    label {
        display: block;
        font-size: 13px;
        font-weight: 700;
        color: #333;
        margin-bottom: 6px;
    }
    input {
        width: 100%;
        height: 46px;
        border: 1px solid #e2e2e2;
        border-radius: 8px;
        padding: 0 14px;
        font-size: 14px;
        margin-bottom: 18px;
        outline: none;
        transition: .2s;
    }
    input:focus { border-color: #C99643; }
    button {
        width: 100%;
        height: 48px;
        border: 0;
        border-radius: 8px;
        background: #C99643;
        color: #fff;
        font-size: 15px;
        font-weight: 800;
        cursor: pointer;
        transition: .2s;
    }
    button:hover { background: #a97f36; }
    .error {
        background: #fdeaea;
        color: #b4232c;
        border-radius: 8px;
        padding: 10px 14px;
        font-size: 13px;
        margin-bottom: 16px;
        text-align: center;
    }
</style>
</head>
<body>

    <form class="login-box" method="post">
        <h1>رواد الظل</h1>
        <p class="sub">لوحة تحكم المنتجات</p>

        <?php if ($error): ?>
            <div class="error"><?= htmlspecialchars($error) ?></div>
        <?php endif; ?>

        <label>اسم المستخدم</label>
        <input type="text" name="username" required autofocus>

        <label>كلمة المرور</label>
        <input type="password" name="password" required>

        <button type="submit">دخول</button>
    </form>

</body>
</html>