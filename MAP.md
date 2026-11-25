# iLike code map

Give AI this file plus only the file(s) the task touches. All JS files in `js/` are plain scripts that share globals (no modules, no build step). `index.html` loads them in the order below, and **order matters**.

**Adding or renaming a JS file:** update the `<script>` list in `index.html` AND the `SHELL` list in `sw.js`, then bump `VERSION` in `sw.js`.

`style.css` is one file on purpose: it is built in patch layers (later rules override earlier ones), so cutting it by feature would change how the app looks. Search it by section comments instead.

`index.ts` is the push Edge Function (Supabase). `sw.js` is the service worker and must stay in the repo root (not in `js/`), because the app registers `sw.js` from the root.

## Load order and contents

1. **js/catalog.js** (99 lines): Interest catalog data (INTEREST_CATALOG). Loads BEFORE core.js.
2. **js/core.js** (392 lines): Supabase connection, app state `S`, small helpers, toast, back-button layers, viewport/keyboard, lightbox, uploads.
   - setMyAv, tmTap, fetchAll, alreadySent, failSync, failDismiss, slDraw, slMore, toast, share, shareCurrentEvent, show, setupBackGuard, topOpenLayer, closeTopLayer, syncAppViewport, keepFieldVisible, confirmBox, cfyes, prep, upload, rmFiles, openLb, closeLb, lbShow, lbGo, lbPaint, lbClamp, lbZoom
2b. **js/store.js** (114 lines): On-device store (`Store`): saves feed, chats, profiles and settings in IndexedDB for an instant start, trims itself daily, wiped on sign-out. Photos are kept by `sw.js` in the `ilike-img` cache. Thumbnails: `thumb`, `timg`, `upload(bucket,blob,thumbBlob)` live in core.js (new photos are saved as `_f.jpg` + `_t.jpg`).
3. **js/auth.js** (157 lines): Sign in / sign up, onboarding.
   - keep, renderAuth, swap, go, resendConfirm, forgot, logout, renderOb, obInterests, obPick, saveOb, obGo, obProfileUi, obAvatar, obProf, obCands, obPeopleUi, obTog, obPostUi, obSendPost, finishOb
4. **js/data.js** (184 lines): Boot, loading and hydrating data, #post / #event links.
   - boot, load, syncInterestCatalog, getProfiles, replyCounts, hydrate, loadPosts, morePosts, watchMore, loadPeople, ensurePost, openPostId
5. **js/feed.js** (348 lines): Home feed, compose post, post menu/edit/delete, replies, Discover.
   - post, same, openSames, paintFeed, home, setF, tapFab, closePost, renderPhotos, publish, openPm, closePm, openEd, saveEd, delPost, renderThread, loadReplies, focusReply, moreReplies, openThread, closeThread, sendReply, delReply, mix, findTab, ftab, openPost
5b. **js/photos.js** (184 lines): Post photos: crop, drag to reorder, grid layout (New post and Edit post).
   - phRender, phSetLay, phPick, phRm, phDrag, dgMove, dgEnd, phCrop, pcInit, pcRatio, pcReset, pcPlace, pcZoom, pcSlide, pcClose, pcDone
5c. **js/video.js** (221 lines): Video posts: one video (up to 60 s and 50 MB) with a thumbnail taken from the video, playback.
   - vidProbe, vidPick, vidUpload, vidRender, vidRm, vidIcon, vidKill, vidMake, vidPlay, vidPause, vidReset, vidAuto, playVid, vidTick, vidTickSoon, vidWrapDraw, vidHookDraw
6. **js/profile.js** (396 lines): You tab and profile header, edit profile, crop editor.
   - meTab, mineBody, setMt, meCompact, meClear, meLayout, mePaint, meSync, meSet, meScrolled, meTop, loadLiked, drawPk, openPk, ask, toggleInt, newArtist, createArtistPk, newInterest, draw, peVals, peDirty, peSync, peFld, peErrors, peInput, peUserAvail, openPe, closePe, saveProfile, setAvatarBlob, pickAvatar, setBanner, pickBanner, removeBanner, removeAvatar, cropFile, crPaint, crSetZ, crClose, crCancel, crSave
7. **js/settings.js** (170 lines): Settings, themes, push setup, realtime subscriptions.
   - paintCustomize, savePrefs, setTheme, accent, fnt, applyPrefs, pushSub, pushSave, pushSync, pushDrop, enablePush, disablePush, togglePref, paintPush, togglePw, openSet, changePw, recoverUi, subscribe, updateBadges
8. **js/chat.js** (299 lines): Direct messages and circles (group chats).
   - loadMsgs, leaveRoom, closeOv, setBar, drawStrip, openMembers, leaveCircle, openChats, openDm, drawDm, settle, jumpNew, syncSend, msgMenu, closeMm, editMsg, resetEdit, saveMsgEdit, delMsg, onMsgUpd, onMsgDel, goDiscover, openChat, loadCircle, drawCircle, onCircleMsg, onCircleUpd, onCircleDel, joinRoom, sayHi, markRead, send, onMsg, back
9. **js/notifs.js** (131 lines): Notifications, interests/artists, follows.
   - notifMeta, loadNotifs, ngroups, drawNotifs, setNF, moreNotifs, markIds, readNg, markNotifsRead, openNotifs, openNg, onNotif, ensureInts, loadInts, loadFollows, toggleFollow, peopleSheet, openFollows
10. **js/members.js** (115 lines): Other members' profiles, achievements.
   - closePf, closeAll, openProfile, drawPf, pfBody, setPfTab, pfScrolled, loadAch, checkAch, drawBadges, showAch
11. **js/events.js** (468 lines): Events list and full-screen view, live chat, gallery, comments, create/edit/cancel.
   - loadEvents, eventsTab, eventCard, openEvent, closeEventView, setEvTab, keepInputs, restoreInputs, renderEventFullscreen, evChatRows, paintEvChat, loadEventChat, sendEventChat, loadEventGallery, uploadEventGallery, delGalleryPhoto, evLive, evLiveStop, onEvMsg, onEvMsgDel, onEvPhoto, onEvPhotoDel, loadEventComments, sendEventComment, delEventComment, paintEv, imin, drawEvEm, openEv, saveEv, cancelEv, loadPast, togglePast, pastDraw, delEv
12. **js/tickets.js** (75 lines): Buy Tickets modal (to be deleted, plan item 41).
   - openTickets, closeTickets, renderTicketTiers, adjustTicketQty, confirmTickets
13. **js/extras.js** (281 lines): Bottom nav, skeletons, drafts, pull to refresh, PWA install.
   - updateThemeIcon, setSel, saveDraft, restoreDraft, clearDraft, discardDraft, rdSet, saveRD, refreshAll, ptrBox, ptrPaint, ptrEnd, refreshInstall, installApp, updateThemeColor
14. **js/safety.js** (222 lines): Blocking, feedback, stats, delete account, report sheet.
   - muted, applyBlocks, syncStatus, blockUser, paintFbk, openFb, closeFb, sendFb, drawStats, setStN, paintStats, drawFeedback, fbDone, openDa, closeDa, daCheck, doDelete, openBlocked, unblock, axGet, openAx, closeAx, axBlock, axModerate, axDelete, axReport, drawRp, closeRp, sendReport, loadRepCount, paintRepBadge
15. **js/moderation.js** (199 lines): Moderator panel, user admin, duplicate checks, lists, invites.
   - openMod, drawMod, drawReports, repClose, repDelete, drawUsers, searchUsers, drawEventPublishers, searchEventPublishers, setEventPublisher, openUa, drawUa, closeUa, uaDone, uaMute, uaRole, uaBan, lev, similarTo, dupAsk, drawLists, drawInvites, admNewInvite, toggleInvite, copyInvite
16. **js/legal.js** (7 lines): Opens Terms / Privacy / Contact on the landing site in the browser (`LANDING_URL` in core.js).
   - openLegal
17. **js/admin.js** (70 lines): Admin artist/interest tools (merge, rename, delete).
   - admAddArtist, admCreateArtist, admDupes, admPair, admArt, admRename, admSaveRename, admMerge, drawMg, admDoMerge, admDelete, refreshInterests
18. **js/main.js** (3 lines): Starts the app. Always LAST.
