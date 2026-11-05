@echo off
echo ========================================================
echo  Mendorong Proyek USER ke GitHub
echo  Target: https://github.com/riskyamal21-a11y/user.git
echo ========================================================
if not exist .git (
    git init
)
git add .
git commit -m "feat: TugasKu user Next.js app with Supabase (Light Mode)"
git branch -M main
git remote remove origin >nul 2>&1
git remote add origin https://github.com/riskyamal21-a11y/user.git
git push -u origin main --force
echo.
echo Selesai!
pause
