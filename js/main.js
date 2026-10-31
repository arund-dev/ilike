try{applyPrefs(JSON.parse(localStorage.getItem('il-prefs')||'null'))}catch(e){}
updateThemeIcon();paintCustomize();
boot();
