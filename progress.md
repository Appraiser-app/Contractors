
## 2026-07-17 — סבב תיקוני איכות קוד
- הוחלו ~285 תיקוני linter אוטומטיים בטוחים (type imports, Number.parseInt/parseFloat, template literals, optional chaining, self-closing elements).
- תוקנו 3 בעיות type-safety ידנית (implicit/explicit any).
- TypeScript + build עוברים נקי.

### פתוח (a11y — לא באגים פונקציונליים):
- [ ] ~258 SVG דקורטיביים ללא title (נגישות)
- [ ] ~186 labels ללא שיוך input (נגישות)
- [ ] ~161 כפתורים ללא type מפורש (עצמאיים, לא בתוך טפסים — טפסים כבר תקינים)
- [ ] ~12 useEffect deps (קוד עובד, שינוי מסוכן — עלול ליצור לולאה)
