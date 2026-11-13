var ROKH_PUB = {"kty":"EC","crv":"P-256","x":"nMBJqaUUayqgjVWvqONwRGrCL89aygeP3hjLNIaaU2g","y":"4VeNs_MKat3e9p8fvZ_gPCLwfEB-lTzKMVTjkQVNDvM"};
/* Rokhssati code kit: phone-locked activation codes (pure JS, works offline everywhere).
   code = 12 base32 chars = 14 bits end-day + 46 bits HMAC-SHA256(key, deviceId|day). */
var RokhCode = (function () {
  var A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var EPOCH = Date.UTC(2026, 0, 1);
  var K = [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2];
  function sha256(b) {
    var H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    var m = b.slice(), bl = b.length * 8, i, j;
    m.push(0x80); while (m.length % 64 !== 56) m.push(0);
    for (i = 7; i >= 0; i--) m.push(i > 3 ? 0 : (bl >>> (i * 8)) & 255);
    var w = new Array(64);
    for (i = 0; i < m.length; i += 64) {
      for (j = 0; j < 16; j++) w[j] = (m[i + 4 * j] << 24) | (m[i + 4 * j + 1] << 16) | (m[i + 4 * j + 2] << 8) | m[i + 4 * j + 3];
      for (j = 16; j < 64; j++) {
        var a0 = w[j - 15], a1 = w[j - 2];
        var s0 = ((a0 >>> 7) | (a0 << 25)) ^ ((a0 >>> 18) | (a0 << 14)) ^ (a0 >>> 3);
        var s1 = ((a1 >>> 17) | (a1 << 15)) ^ ((a1 >>> 19) | (a1 << 13)) ^ (a1 >>> 10);
        w[j] = (w[j - 16] + s0 + w[j - 7] + s1) | 0;
      }
      var a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (j = 0; j < 64; j++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var t1 = (h + S1 + ((e & f) ^ (~e & g)) + K[j] + w[j]) | 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var t2 = (S0 + ((a & bb) ^ (a & c) ^ (bb & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = bb; bb = a; a = (t1 + t2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + bb) | 0; H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0; H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }
    var out = [];
    for (i = 0; i < 8; i++) out.push((H[i] >>> 24) & 255, (H[i] >>> 16) & 255, (H[i] >>> 8) & 255, H[i] & 255);
    return out;
  }
  function bytes(s) { var o = []; s = unescape(encodeURIComponent(s)); for (var i = 0; i < s.length; i++) o.push(s.charCodeAt(i)); return o; }
  function hex2b(h) { var o = []; for (var i = 0; i < h.length; i += 2) o.push(parseInt(h.substr(i, 2), 16)); return o; }
  function hmac(key, msg) {
    var k = key.slice(); if (k.length > 64) k = sha256(k); while (k.length < 64) k.push(0);
    var ip = k.map(function (x) { return x ^ 0x36; }), op = k.map(function (x) { return x ^ 0x5c; });
    return sha256(op.concat(sha256(ip.concat(msg))));
  }
  function bits(arr, n) { var s = ""; for (var i = 0; i < arr.length && s.length < n; i++) s += ("00000000" + arr[i].toString(2)).slice(-8); return s.slice(0, n); }
  function b32(bs) { var o = ""; for (var i = 0; i < bs.length; i += 5) o += A[parseInt(bs.substr(i, 5), 2)]; return o; }
  function clean(s) { var c = String(s || "").toUpperCase().replace(/[^A-Z0-9]/g, ""); return (c.length === 15 && c.slice(0, 3) === "RKS") ? c.slice(3) : c; }
  function fmtId(raw) { return raw.slice(0, 4) + "-" + raw.slice(4, 8); }
  /* device id: 8 chars from a stable seed */
  function deviceId(seed) { return fmtId(b32(bits(sha256(bytes("rokh-dev|" + seed)), 40))); }
  function sig(keyHex, dev, day) { return bits(hmac(hex2b(keyHex), bytes(clean(dev) + "|" + day)), 46); }
  function make(keyHex, dev, day) {
    var bs = ("00000000000000" + day.toString(2)).slice(-14) + sig(keyHex, dev, day), c = b32(bs);
    return "RKS-" + c.slice(0, 4) + "-" + c.slice(4, 8) + "-" + c.slice(8, 12);
  }
  /* returns {until: ms} if valid for this device, else null */
  function check(keyHex, dev, code) {
    var c = clean(code); if (c.length !== 12) return null;
    var bs = "";
    for (var i = 0; i < 12; i++) { var v = A.indexOf(c[i]); if (v < 0) return null; bs += ("00000" + v.toString(2)).slice(-5); }
    var day = parseInt(bs.slice(0, 14), 2);
    if (bs.slice(14) !== sig(keyHex, dev, day)) return null;
    return { day: day, until: dayEnd(day) };
  }
  var DZ = 3600000; /* Algeria: UTC+1 all year */
  function dayOf(ms) { return Math.floor((ms + DZ - EPOCH) / 86400000); }
  function dayEnd(day) { return EPOCH + (day + 1) * 86400000 - 1 - DZ; }
  return { make: make, check: check, deviceId: deviceId, dayOf: dayOf, dayEnd: dayEnd, sha256: sha256, bytes: bytes, b32: b32, bits: bits };
})();

(function () {
  "use strict";
  var app = document.getElementById("app");
  var LANGS = { ar: { lang: "ar", dir: "rtl" }, fr: { lang: "fr", dir: "ltr" }, dz: { lang: "ar-DZ", dir: "rtl" } };
  var lang = "ar";
  var listeners = [];
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var UI = {
    ar: { codeNet: "يلزم الاتصال بالإنترنت لتفعيل الرمز. حاول مرة أخرى.", codeWait: "جارٍ التحقق…", ltPass: "ممتاز! أنت جاهز لهذا الاختبار.", ltFail: "راجع الأخطاء وأعد الاختبار.", lockExam: "الامتحانات التجريبية من البريميوم، مُهدى خلال الإطلاق (تجربة 3 أيام أو رمز).", lockMore: "النسخة المجانية: %n أسئلة تجريبية، دائمًا نفسها. كل التدريب والامتحانات التجريبية في البريميوم، مُهدى خلال الإطلاق (تجربة 3 أيام أو رمز).", unlock: "احصل على الدخول المُهدى", codeOk: "تم التفعيل حتى %d.", codeKo: "الرمز لا يطابق هذا الجهاز: تحقق من كل حرف، وأن رقم الجهاز الذي أرسلته لنا هو %dev.", codeExp: "انتهت صلاحية هذا الرمز (%d). اطلب رمزًا جديدًا من صفحة الاتصال.", codeForm: "الرمز يتكون من 12 حرفًا (حروف وأرقام، دون O و I و 0 و 1). تحقق من الكتابة.", codeOther: "هذا الرمز مستعمل على جهاز آخر. كل رمز يعمل على جهاز واحد: اطلب رمزًا لهذا الجهاز (%dev).", codeSrv: "مشكلة في الخادم، ليست منك. أعد المحاولة بعد قليل.", codeMany: "محاولات كثيرة. انتظر ساعة ثم أعد المحاولة، أو راسلنا من صفحة الاتصال.", payOk: "تم إرسال الوصل. ستصلك رسالة برمز التفعيل بعد التحقق.", payKo: "تعذّر الإرسال من هنا. أرسل صورة الوصل عبر واتساب أو رسالة نصية.", active: "التفعيل صالح حتى %d.", sitQ: "ما هو ترتيب المرور؟", signQ: "ماذا تعني هذه الإشارة؟", right: "✓ إجابة صحيحة", wrong: "✗ ليس تمامًا", markRight: "صحيح", markWrong: "اختيارك", next: "السؤال التالي", last: "عرض النتيجة", validate: "تأكيد",
          score: "نتيجتك", restart: "أعد السلسلة", revCh: "📘 راجع الدرس: ", great: "ممتاز! أنت تعرف القانون جيدًا.", mid: "بداية جيدة. راجع الدروس المعنية.", low: "الوقت مناسب للمراجعة.",
          time: "الوقت", recap: "التصحيح", yours: "إجابتك", none: "بدون إجابة", correct: "الإجابة الصحيحة", pick: "اختر إجابة.", examNote: "التصحيح في نهاية الامتحان.",
          ok: "لا توجد مخالفة", d2: "مخالفة من الدرجة الثانية", d3: "مخالفة من الدرجة الثالثة", d4: "مخالفة من الدرجة الرابعة", delit: "جنحة تُحال على القضاء", cur: "دج", inLimit: "سرعتك ضمن الحد المسموح.", check: "أدخل أرقامًا صحيحة.",
          formOk: "شكرًا!", formKo: "يرجى كتابة رسالتك.", formKoAE: "اترك رقم هاتف أو بريدًا لنتصل بمدرستك.", cSend: "جارٍ الإرسال…", cOk: "وصلتنا رسالتك، سنرد عليك قريبًا.", cNet: "تعذر الإرسال. تحقق من الإنترنت وأعد المحاولة.", empty: "لا توجد أسئلة لهذا المحور بعد.", sig: "⚑ أبلغ عن خطأ", sigWhy: "ما المشكلة؟", sigR: ["الجواب خاطئ", "خطأ في الترجمة", "الصورة غير واضحة", "شيء آخر"], sigNote: "تفاصيل (اختياري)", sigSend: "أرسل", sigOk: "شكرًا! سنراجع هذا السؤال.", inNew: "ردّت عليك رخصتي.", inSee: "اقرأ الرد", inMe: "أنت", inR: "رخصتي", inEmpty: "لم ترسل أي رسالة من هذا الجهاز بعد.", inNet: "تعذر تحميل الرسائل. تحقق من الإنترنت.", resume: "عندك امتحان تجريبي لم يكتمل: السؤال %i من %n، بقي %t.", resumeGo: "أكمل الامتحان", resumeNew: "امتحان جديد", cxNone: "اختر محورًا واحدًا على الأقل.", cxLock: "الامتحان المخصّص من البريميوم، مُهدى خلال الإطلاق (تجربة 3 أيام أو رمز).", zoom: "تكبير الرسم", zoomClose: "إغلاق", trMaj: "حدّث التطبيق إلى آخر نسخة للاستفادة من العرض.", trLeft: "بقي %n من 10 عروض مجانية.", trNone: "انتهت العروض المجانية. شكرًا لاهتمامك!", trOk: "تم تفعيل البريميوم حتى %d.", trDeja: "هذا الهاتف استفاد من العرض من قبل.", trNet: "يلزم الاتصال بالإنترنت. حاول مرة أخرى.", favAdd: "أضف إلى المفضلة", favDel: "احذف من المفضلة", favMax: "النسخة المجانية: 20 مفضّلة كحد أقصى. المفضّلات غير المحدودة في البريميوم، مُهدى خلال الإطلاق (تجربة 3 أيام أو رمز).", favEmpty: "لا توجد أسئلة في المفضلة بعد. اضغط على النجمة ☆ أثناء التدريب لإضافة سؤال." },
    fr: { codeNet: "Une connexion internet est nécessaire pour activer le code. Réessayez.", codeWait: "Vérification…", ltPass: "Bravo, vous êtes prêt pour ce test.", ltFail: "Revoyez vos erreurs et refaites le test.", lockExam: "Les examens blancs font partie du Premium, offert pendant le lancement (essai 3 jours ou code).", lockMore: "Version gratuite : %n questions d'essai, toujours les mêmes. Tout l'entraînement et les examens blancs : Premium, offert pendant le lancement (essai 3 jours ou code).", unlock: "Obtenir l'accès offert", codeOk: "Activé jusqu'au %d.", codeKo: "Ce code ne correspond pas à cet appareil : vérifiez chaque caractère, et que le numéro d'appareil envoyé est bien %dev.", codeExp: "Ce code a expiré (%d). Demandez-en un nouveau depuis la page Contact.", codeForm: "Un code fait 12 caractères (lettres et chiffres, sans O, I, 0 ni 1). Vérifiez la saisie.", codeOther: "Ce code est déjà utilisé sur un autre appareil. Un code ne marche que sur un appareil : demandez-en un pour celui-ci (%dev).", codeSrv: "Problème du serveur, pas de votre côté. Réessayez dans un moment.", codeMany: "Trop d'essais. Attendez une heure avant de réessayer, ou écrivez-nous depuis la page Contact.", payOk: "Reçu envoyé. Vous recevrez votre code par SMS après vérification.", payKo: "Envoi impossible ici. Envoyez la photo du reçu par WhatsApp ou SMS.", active: "Activation valable jusqu'au %d.", sitQ: "Dans quel ordre les véhicules passent-ils ?", signQ: "Que signifie ce panneau ?", right: "✓ Bonne réponse", wrong: "✗ Pas tout à fait", markRight: "Correct", markWrong: "Votre choix", next: "Question suivante", last: "Voir mon score", validate: "Valider",
          score: "Votre score", restart: "Recommencer", revCh: "📘 Revoir le chapitre : ", great: "Excellent ! Vous connaissez bien le code.", mid: "Bon début. Revoyez les leçons concernées.", low: "C'est le moment de réviser.",
          time: "Temps", recap: "Correction", yours: "Votre réponse", none: "Sans réponse", correct: "Bonne réponse", pick: "Choisissez une réponse.", examNote: "Correction à la fin de l'examen.",
          ok: "Pas d'infraction", d2: "Contravention du 2e degré", d3: "Contravention du 3e degré", d4: "Contravention du 4e degré", delit: "Délit jugé par le tribunal", cur: "DA", inLimit: "Vous êtes dans la limite.", check: "Entrez des valeurs valides.",
          formOk: "Merci !", formKo: "Écrivez votre message.", formKoAE: "Laissez un téléphone ou un e-mail pour que nous recontactions votre auto-école.", cSend: "Envoi…", cOk: "Message reçu, nous vous répondons bientôt.", cNet: "Envoi impossible. Vérifiez votre connexion et réessayez.", empty: "Pas encore de questions pour ce thème.", sig: "⚑ Signaler une erreur", sigWhy: "Quel est le problème ?", sigR: ["La réponse est fausse", "Erreur de traduction", "Image peu claire", "Autre chose"], sigNote: "Détails (facultatif)", sigSend: "Envoyer", sigOk: "Merci ! Nous allons vérifier cette question.", inNew: "Rokhssati vous a répondu.", inSee: "Lire la réponse", inMe: "Vous", inR: "Rokhssati", inEmpty: "Aucun message envoyé depuis cet appareil pour l'instant.", inNet: "Impossible de charger vos messages. Vérifiez votre connexion.", resume: "Vous avez un examen blanc en cours : question %i sur %n, il reste %t.", resumeGo: "Reprendre l'examen", resumeNew: "Nouvel examen", cxNone: "Choisissez au moins un thème.", cxLock: "L'examen personnalisé fait partie du Premium, offert pendant le lancement (essai 3 jours ou code).", zoom: "Agrandir le schéma", zoomClose: "Fermer", trMaj: "Mettez l'appli à jour pour profiter de l'offre.", trLeft: "Encore %n essai(s) gratuit(s) sur 10.", trNone: "Les essais gratuits sont épuisés. Merci de votre intérêt !", trOk: "Premium activé jusqu'au %d.", trDeja: "Ce téléphone a déjà profité de l'offre.", trNet: "Une connexion internet est nécessaire. Réessayez.", favAdd: "Ajouter aux favoris", favDel: "Retirer des favoris", favMax: "Version gratuite : 20 favoris au maximum. Favoris illimités avec le Premium, offert pendant le lancement (essai 3 jours ou code).", favEmpty: "Aucun favori pour l'instant. Touchez l'étoile ☆ pendant l'entraînement pour garder une question." },
    dz: { codeNet: "لازم الأنترنت باش تفعّل الكود. عاود جرّب.", codeWait: "راهو يتحقق…", ltPass: "مليح بزاف! راك واجد.", ltFail: "عاود شوف الغلطات وعاود الاختبار.", lockExam: "الامتحانات التجريبية في البريميوم، بلاش في الإطلاق (تجربة 3 أيام ولا كود).", lockMore: "النسخة بلاش: %n أسئلة باش تجرّب، ديما هوما. كامل التدريب والامتحانات في البريميوم، بلاش في الإطلاق (تجربة 3 أيام ولا كود).", unlock: "خوذ الدخول بلاش", codeOk: "تفعّل حتى %d.", codeKo: "هاد الكود ماشي تاع هاد التيليفون: شوف كل حرف، وشوف بلي النيمرو اللي بعثتهولنا هو %dev.", codeExp: "هاد الكود فات وقتو (%d). اطلب واحد جديد من صفحة الاتصال.", codeForm: "الكود فيه 12 حرف (حروف وأرقام، بلا O و I و 0 و 1). شوف واش كتبتو مليح.", codeOther: "هاد الكود مستعمل في تيليفون آخر. كل كود يخدم في تيليفون واحد: اطلب كود لهاد التيليفون (%dev).", codeSrv: "كاين مشكل في السيرفر، ماشي منك. عاود من بعد شوية.", codeMany: "جرّبت بزاف. استنى ساعة وعاود، ولا ابعثلنا من صفحة الاتصال.", payOk: "الوصل تبعث. يجيك الكود في ميساج من بعد ما نتأكدو.", payKo: "ما قدرناش نبعثو من هنا. ابعث تصويرة الوصل في واتساب ولا ميساج.", active: "التفعيل يخدم حتى %d.", sitQ: "شكون يفوت الأول؟", signQ: "واش معناه هاد البانو؟", right: "✓ صحيح!", wrong: "✗ ماشي هاكا", markRight: "صحيح", markWrong: "اخترت هادي", next: "السؤال اللي بعدو", last: "شوف النتيجة", validate: "أكّد",
          score: "النتيجة تاعك", restart: "عاود من الأول", revCh: "📘 راجع الدرس : ", great: "برافو! راك تعرف القانون مليح.", mid: "مليح، راجع الدروس اللي غلطت فيهم.", low: "لازم تراجع شوية.",
          time: "الوقت", recap: "التصحيح", yours: "الجواب تاعك", none: "ما جاوبتش", correct: "الجواب الصحيح", pick: "اختار جواب.", examNote: "التصحيح في اللخر تاع الامتحان.",
          ok: "ما كانش خطية", d2: "خطية من الدرجة الثانية", d3: "خطية من الدرجة الثالثة", d4: "خطية من الدرجة الرابعة", delit: "جنحة تروح للمحكمة", cur: "دج", inLimit: "راك في الحد المسموح.", check: "دخّل أرقام صحاح.",
          formOk: "يعطيك الصحة!", formKo: "اكتب الميساج.", formKoAE: "خلّي نيمرو ولا إيميل باش نعيطو للأوطو إيكول تاعك.", cSend: "راهو يتبعث…", cOk: "وصلنا الميساج، نردو عليك قريب.", cNet: "ما تبعثش. شوف الأنترنت وعاود.", empty: "مازال ما كانش أسئلة لهاد المحور.", sig: "⚑ بلّغ على غلطة", sigWhy: "واش هو المشكل؟", sigR: ["الجواب غالط", "غلطة في الترجمة", "التصويرة ماشي واضحة", "حاجة أخرى"], sigNote: "تفاصيل (إذا حبيت)", sigSend: "ابعث", sigOk: "يعطيك الصحة! راح نشوفو هاد السؤال.", inNew: "رخصتي ردّت عليك.", inSee: "اقرا الرد", inMe: "أنت", inR: "رخصتي", inEmpty: "مازال ما بعثت حتى ميساج من هاد الجهاز.", inNet: "ما قدرناش نجيبو الميساجات. شوف الأنترنت.", resume: "عندك امتحان تجريبي ما كمّلتوش: السؤال %i من %n، بقات %t.", resumeGo: "كمّل الامتحان", resumeNew: "امتحان جديد", cxNone: "اختار محور واحد على الأقل.", cxLock: "الامتحان على كيفك في البريميوم، بلاش في الإطلاق (تجربة 3 أيام ولا كود).", zoom: "كبّر الرسمة", zoomClose: "سكّر", trMaj: "حدّث التطبيق لآخر نسخة باش تستافد من العرض.", trLeft: "باقي %n من 10 عروض بلاش.", trNone: "العروض البلاش كملو. يعطيك الصحة!", trOk: "البريميوم تفعّل حتى %d.", trDeja: "هاد التيليفون خدا العرض من قبل.", trNet: "لازم الأنترنت. عاود جرّب.", favAdd: "زيد للمفضلة", favDel: "نحّي من المفضلة", favMax: "النسخة بلاش: 20 مفضّلة برك. بلا حدود في البريميوم، بلاش في الإطلاق (تجربة 3 أيام ولا كود).", favEmpty: "مازال ما كانش أسئلة في المفضلة. اضغط على النجمة ☆ وقت التدريب باش تخبّي سؤال." }
  };
  var t = function (k) { return UI[lang][k]; };
  var fmt = function (n) { return lang === "fr" ? n.toLocaleString("fr-FR").replace(/ | /g, " ") : String(n); };

  /* ---------- anonymous product measurement (functions/api/ev.js) ----------
     Counters only (no identifier, no cookie). Off when: opted out on the Confidentialité page or owner switch
     ("rokhssati-notrack"), Do Not Track / Global Privacy Control. Queue kept in localStorage, sent in one batch. */
  var Measure = (function () {
    var QK = "rokhssati-evq", SK = "rokhssati-evseen";
    function off() { try { if (localStorage.getItem("rokhssati-notrack") === "1") return true; } catch (e) { return true; } return navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl === true; }
    function jget(k) { try { return JSON.parse(localStorage.getItem(k) || "{}") || {}; } catch (e) { return {}; } }
    function jset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
    function add(name, n) { if (n === undefined) n = 1; if (off() || !(n > 0)) return; var q = jget(QK); q[name] = Math.min(200, (q[name] || 0) + n); jset(QK, q); }
    function once(name) { if (off()) return; var s = jget(SK); if (s[name]) return; s[name] = 1; jset(SK, s); add(name); }
    function flush() {
      if (off()) { try { localStorage.removeItem(QK); } catch (e) {} return; }
      var q = jget(QK); if (!Object.keys(q).length) return;
      q._p = window.RokhNative ? "a" : "w";   // appli / site (séparés dans Gestion, 09/11/2026)
      var url = (window.RokhNative ? "https://rokhssati.com" : "") + "/api/ev", body = JSON.stringify(q), sent = false;
      try { sent = navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: "text/plain" })); } catch (e) {}
      if (!sent) { try { fetch(url, { method: "POST", body: body, keepalive: true }); } catch (e) {} }
      try { localStorage.removeItem(QK); } catch (e) {}
    }
    try { if (window.RokhNative && typeof window.RokhNative.setNoTrack === "function") window.RokhNative.setNoTrack(off()); } catch (e) {}   // 1.4.28: same refusal for the app's opens-per-version count
    (function visit() {   // new visitor / came back after 1 day / after 7 days (each counted once per browser)
      if (off()) return;
      var f = null; try { f = localStorage.getItem("rokhssati-first"); } catch (e) { return; }
      var today = Math.floor(Date.now() / 86400000);
      /* cohortes (ROK-01, 10/11/2026) : chaque compteur porte aussi le jour d'arrivée (AAAAMMJJ, UTC), pour lire J+1 / J+7 par cohorte.
         Une date de cohorte, pas un identifiant. vc = nouveau visiteur, r1c = revenu le lendemain, r7c = revenu 7 jours ou plus après. */
      var coh = function (n) { return new Date(n * 86400000).toISOString().slice(0, 10).replace(/-/g, ""); };
      if (!f) {
        try { localStorage.setItem("rokhssati-first", String(today)); } catch (e) {} once("v_new"); once("vc:" + coh(today));
        // RKV3-03 (13/11/2026): where the new visitor came from (utm_source, else the referring site), kept on this device only,
        // so activation can be read per source (a1s:). A category, never the full address.
        var cl = function (x) { return String(x || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 20); }, src = "direct", sp = null;
        try { sp = new URLSearchParams(location.search); } catch (e) {}
        var us = sp && cl(sp.get("utm_source")), uc = sp && cl(sp.get("utm_campaign")), ref = "";
        try { ref = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) {}
        if (window.RokhNative) src = "app";
        else if (us && us.length >= 2) src = us;
        else if (/(^|\.)(facebook|fb|messenger|instagram)\./.test(ref) || /^(l|lm|m)\.facebook\./.test(ref)) src = "facebook";
        else if (/(^|\.)google\./.test(ref)) src = "google";
        else if (/(^|\.)(bing|msn)\./.test(ref)) src = "bing";
        else if (/(^|\.)(youtube|tiktok|whatsapp|t)\./.test(ref)) src = ref.split(".").slice(-2)[0];
        else if (ref && ref.indexOf("rokhssati") < 0) src = "autre";
        try { localStorage.setItem("rokhssati-src", src); } catch (e) {}
        once("src:" + src); if (uc && uc.length >= 2) once("cp:" + uc);
        return;
      }
      var d = today - (+f || today);
      if (d >= 1) once("r1"); if (d >= 7) once("r7");
      if (+f) { if (d === 1) once("r1c:" + coh(+f)); if (d >= 7) once("r7c:" + coh(+f)); }
    })();
    (function nav() {   // parcours anonyme (09/11/2026) : écran vu, écran d'entrée, enchaînement A>B, temps par tranches de 5 s. Aucun identifiant.
      if (off()) return;
      var p = ((location.pathname.split("/").pop() || "index").replace(/\.html?$/, "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 32)) || "index";
      var prev = null; try { prev = sessionStorage.getItem("rokhssati-nav"); } catch (e) { return; }
      if (prev === null) { add(window.RokhNative ? "ss_app" : "ss_web"); add("en:" + p); }
      else if (prev !== p) add("nv:" + prev + ">" + p);
      try { sessionStorage.setItem("rokhssati-nav", p); } catch (e) {}
      add("pv:" + p);
      var t0 = Date.now();
      function stamp() { if (!t0) return; var u = Math.min(120, Math.round((Date.now() - t0) / 5000)); t0 = 0; if (u > 0) add("t5:" + p, u); }
      document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") stamp(); else t0 = Date.now(); });
      window.addEventListener("pagehide", stamp);
    })();
    document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flush(); });
    window.addEventListener("pagehide", flush);
    setTimeout(flush, 4000);
    // NF-09 (13/11/2026): count script errors from our own files (no message, no address), at most one per page
    var jsErr = false;
    window.addEventListener("error", function (e) { if (jsErr || !e || !/\/assets\/|rokhssati|appassets/.test(String(e.filename || ""))) return; jsErr = true; add("jserr"); });
    function cohort(name) {
      var f = null, sr = ""; try { f = +localStorage.getItem("rokhssati-first"); sr = localStorage.getItem("rokhssati-src") || ""; } catch (e) {}
      if (f) once(name + ":" + new Date(f * 86400000).toISOString().slice(0, 10).replace(/-/g, ""));
      if (name === "a1c" && sr) once("a1s:" + sr);   // activation per source (only visitors whose source is known, from 13/11/2026)
    }
    return { add: add, once: once, flush: flush, cohort: cohort };
  })();

  /* ---------- test d'intérêt Premium (09/11/2026) : prix prévus, rien n'est vendu. Un vote par navigateur. ---------- */
  (function prAd() {
    function init() {
      [].forEach.call(document.querySelectorAll('.pr-ad[data-gate="learned"]'), function (ad) {   // P0 : pas de Premium au premier passage
        var ok = false; try { ok = localStorage.getItem("rokhssati-learned") === "1" || JSON.parse(localStorage.getItem("rokhssati-history") || "[]").length > 0; } catch (e) {}
        var sec = ad.closest("section") || ad; if (!ok) { sec.hidden = true; ad.remove(); }
      });
      var ads = document.querySelectorAll(".pr-ad"); if (!ads.length) return;
      Measure.once("pr_v");
      var done = {}; try { done = JSON.parse(localStorage.getItem("rokhssati-pr") || "{}") || {}; } catch (e) {}
      function paint() {
        [].forEach.call(document.querySelectorAll(".pr-ad [data-pr]"), function (b) { b.classList.toggle("is-on", !!done[b.getAttribute("data-pr")]); });
        [].forEach.call(document.querySelectorAll(".pr-ad .pr-thanks"), function (t) { t.hidden = !(done.pr_i || done.pr_m1 || done.pr_m3 || done.pr_y) || !!done.sent; });
      }
      [].forEach.call(document.querySelectorAll(".pr-ad [data-pr]"), function (b) {
        b.addEventListener("click", function () {
          var k = b.getAttribute("data-pr");
          if (k === "pr_i") delete done.pr_n; if (k === "pr_n") { delete done.pr_i; delete done.pr_m1; delete done.pr_m3; delete done.pr_y; }
          if (/^pr_(m1|m3|y)$/.test(k)) { delete done.pr_m1; delete done.pr_m3; delete done.pr_y; done.pr_i = 1; Measure.once("pr_i"); }
          done[k] = 1; Measure.once(k);
          try { localStorage.setItem("rokhssati-pr", JSON.stringify(done)); } catch (e) {}
          paint(); Measure.flush();
        });
      });
      // « qui est intéressé » : contact laissé volontairement (e-mail ou téléphone) + formule choisie → Gestion (contact.js, kind "premium")
      var MM = { ar: ["شكرًا! سنخبرك عند صدور البريميوم.", "اكتب بريدًا إلكترونيًا أو رقم هاتف صحيحًا.", "تعذّر الإرسال. تحقق من الاتصال بالإنترنت."],
                 fr: ["Merci ! Nous vous préviendrons à la sortie du Premium.", "Écrivez un e-mail ou un numéro de téléphone valide.", "Envoi impossible. Vérifiez votre connexion internet."],
                 dz: ["صحّيت! نخبروك كي يخرج البريميوم.", "اكتب إيمايل ولا نيمرو صحيح.", "ما تبعثش. شوف الأنترنت."] };
      [].forEach.call(document.querySelectorAll(".pr-ad .pr-form"), function (f) {
        f.addEventListener("submit", function (e) {
          e.preventDefault();
          var m = MM[lang] || MM.fr, out = f.querySelector(".pr-msg"), v = f.querySelector(".pr-contact").value.trim();
          var mail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? v : "", tel = !mail && /^\+?[0-9 .-]{9,18}$/.test(v) ? v.replace(/[ .-]/g, "") : "";
          out.hidden = false;
          if (!mail && !tel) { out.dataset.state = "ko"; out.textContent = m[1]; return; }
          var pick = done.pr_y ? "y" : done.pr_m3 ? "m3" : done.pr_m1 ? "m1" : "";
          fetch((window.RokhNative ? "https://rokhssati.com" : "") + "/api/contact", { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind: "premium", email: mail, phone: tel, formule: pick, src: window.RokhNative ? "appli" : "site", lang: lang, hp: f.querySelector(".pr-hp").value }) })
            .then(function (r) { return r.json(); }).then(function (j) {
              out.dataset.state = j && j.ok ? "ok" : "ko"; out.textContent = j && j.ok ? m[0] : m[1];
              if (j && j.ok) { done.sent = 1; try { localStorage.setItem("rokhssati-pr", JSON.stringify(done)); } catch (e) {} Measure.once("pr_c"); Measure.flush();
                setTimeout(function () { [].forEach.call(document.querySelectorAll(".pr-ad .pr-ask"), function (q) { var p = document.createElement("p"); p.className = "pr-done"; p.textContent = m[0]; q.parentNode.replaceChild(p, q); }); paint(); }, 1200); }
            }).catch(function () { out.dataset.state = "ko"; out.textContent = m[2]; });
        });
      });
      if (done.sent) [].forEach.call(document.querySelectorAll(".pr-ad .pr-ask"), function (q) { var p = document.createElement("p"); p.className = "pr-done"; p.textContent = (MM[lang] || MM.fr)[0]; q.parentNode.replaceChild(p, q); });
      paint();
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  })();

  /* ---------- progress & history store (this device only) ---------- */
  var Track = (function () {
    var PK = "rokhssati-progress", HK = "rokhssati-history", EK = "rokhssati-errors", DK = "rokhssati-days", FK = "rokhssati-favs", TK = "rokhssati-tstats";
    function get(k, d) { try { var v = JSON.parse(localStorage.getItem(k) || "null"); return v === null ? d : v; } catch (e) { return d; } }
    function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
    function day(d) { d = d || new Date(); return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
    function markDay() { var a = get(DK, []), td = day(); if (a.indexOf(td) < 0) { a.push(td); set(DK, a.slice(-120)); } }
    function learned() { try { localStorage.setItem("rokhssati-learned", "1"); } catch (e) {} }   // P0 : 1re interaction pédagogique (Premium montré ensuite)
    function prog() { var p = get(PK, {}); p.read = p.read || {}; p.done = p.done || {}; p.qs = p.qs || {}; return p; }
    return {
      day: day,
      prog: prog,
      days: function () { return get(DK, []); },
      read: function (theme, chap, step, n) {
        var p = prog();
        if ((p.read[chap] || 0) < step) p.read[chap] = Math.min(step, n);
        if (step >= 2) learned();
        p.last = { theme: theme, chap: chap, step: step, ts: Date.now() };
        if (step >= n && !p.done[chap]) { p.done[chap] = Date.now(); Measure.add("c_done"); Measure.once("cd:" + chap); Measure.once("a1"); Measure.cohort("a1c"); }
        set(PK, p); markDay();
      },
      chapQ: function (qid, ok) { var p = prog(); p.qs[qid] = ok ? 1 : 0; set(PK, p); this.answer(qid, ok); },
      answer: function (qid, ok, theme) {
        if (!qid) return;
        learned();
        if (theme) { var ts = get(TK, {}), x = ts[theme] || (ts[theme] = { r: 0, w: 0 }); if (ok) x.r++; else x.w++; set(TK, ts); }
        var e = get(EK, {});
        if (/^q[0-9a-f]{6,12}$/.test(qid)) Measure.once("qan:" + qid);   // 13/11/2026: answered (same rule as qko: once a day per device) -> real error rate in Gestion
        if (ok) delete e[qid]; else { e[qid] = (e[qid] || 0) + 1; Measure.once("qko:" + qid); }
        set(EK, e); markDay();
      },
      errors: function () { return get(EK, {}); },
      test: function (kind, theme, score, total) {
        if (!total) return;
        learned();
        var h = get(HK, []);
        h.push({ ts: Date.now(), kind: kind, theme: theme || "all", score: score, total: total });
        Measure.add(kind === "exam" ? "e_end" : "t_end"); Measure.once("a1"); Measure.cohort("a1c");
        if (kind === "exam") { Measure.add("e_pts", score); Measure.add("e_tot", total); }
        set(HK, h.slice(-200)); markDay();
      },
      history: function () { return get(HK, []); },
      favs: function () { return get(FK, {}); },
      tstats: function () { return get(TK, {}); },
      dump: function () { var o = { v: 1, at: Date.now() }; [PK, HK, EK, DK, FK, TK].forEach(function (k) { o[k] = get(k, null); }); return o; },
      load: function (o) { if (!o || o.v !== 1) return false; [PK, HK, EK, DK, FK, TK].forEach(function (k) { if (o[k] !== null && o[k] !== undefined) set(k, o[k]); else { try { localStorage.removeItem(k); } catch (e) {} } }); return true; },
      setFav: function (id, on) { var f = get(FK, {}); if (on) f[id] = Date.now(); else delete f[id]; set(FK, f); return f; },
      reset: function () { [PK, HK, EK, DK, FK, TK].forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} }); }
    };
  })();

  /* ---------- language ---------- */
  function applyLang(l) {
    if (!LANGS[l]) l = "ar";
    lang = l;
    app.setAttribute("data-l", l);
    app.setAttribute("lang", LANGS[l].lang);
    app.setAttribute("dir", LANGS[l].dir);
    document.documentElement.setAttribute("lang", LANGS[l].lang);
    $$("[data-setlang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.setlang === l)); });
    try { localStorage.setItem("rokhssati-lang", l); } catch (e) {}
    /* native <select> options cannot hide spans: show the chosen language only */
    $$("option[data-fr]").forEach(function (o) { o.textContent = o.getAttribute("data-" + l) || o.getAttribute("data-fr"); });
    listeners.forEach(function (f) { f(); });
  }
  $$("[data-setlang]").forEach(function (b) { b.addEventListener("click", function () { applyLang(b.dataset.setlang); }); });

  /* ---------- navigation ---------- */
  var header = $(".top");
  var burger = $(".burger");
  function closeSubs(except) {
    $$(".has-sub.open").forEach(function (li) {
      if (li !== except) { li.classList.remove("open"); $(".nav-btn", li).setAttribute("aria-expanded", "false"); }
    });
  }
  $$(".nav-btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var li = btn.parentElement, open = !li.classList.contains("open");
      closeSubs(li);
      li.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });
  if (burger) burger.addEventListener("click", function () {
    var open = !header.classList.contains("nav-open");
    header.classList.toggle("nav-open", open);
    burger.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", function (e) { if (!e.target.closest || !e.target.closest(".has-sub")) closeSubs(null); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeSubs(null); });

  /* ---------- tabs ---------- */
  $$("[data-tabs]").forEach(function (list) {
    var tabs = $$("[role=tab]", list);
    function select(tab) {
      tabs.forEach(function (b) {
        var on = b === tab;
        b.setAttribute("aria-selected", String(on)); b.tabIndex = on ? 0 : -1;
        var p = document.getElementById(b.getAttribute("aria-controls")); if (p) p.hidden = !on;
      });
    }
    tabs.forEach(function (b, i) {
      b.addEventListener("click", function () { select(b); });
      b.addEventListener("keydown", function (e) {
        var rtl = app.getAttribute("dir") === "rtl";
        var next = ["ArrowDown", rtl ? "ArrowLeft" : "ArrowRight"], prev = ["ArrowUp", rtl ? "ArrowRight" : "ArrowLeft"];
        var d = next.indexOf(e.key) >= 0 ? 1 : prev.indexOf(e.key) >= 0 ? -1 : 0;
        if (!d) return; e.preventDefault();
        var nb = tabs[(i + d + tabs.length) % tabs.length]; select(nb); nb.focus();
      });
    });
    select(tabs.filter(function (b) { return b.getAttribute("aria-selected") === "true"; })[0] || tabs[0]);
  });

  /* "Mes messages": a random token kept on this device; replies are read with it (functions/api/inbox.js) */
  var API_BASE = window.RokhNative ? "https://rokhssati.com" : "";
  function inboxBox(create) {
    var b = null; try { b = localStorage.getItem("rokhssati-box"); } catch (e) {}
    if (!b && create) {
      var a = new Uint8Array(18); (window.crypto || window.msCrypto).getRandomValues(a);
      b = Array.prototype.map.call(a, function (x) { return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".charAt(x % 64); }).join("") + Date.now().toString(36);
      try { localStorage.setItem("rokhssati-box", b); } catch (e) {}
    }
    // app >= 1.4.21: lets Android check for replies and show a notification (InboxJob.java)
    if (b && window.RokhNative && typeof window.RokhNative.setBox === "function") { try { window.RokhNative.setBox(b); } catch (e) {} }
    return b;
  }
  var I18N_FR_SIG = ["La réponse est fausse", "Erreur de traduction", "Image peu claire", "Autre chose"];
  /* ---------- quiz engine ---------- */
  var DATA = null;
  var dataEl = document.getElementById("quizData");
  if (dataEl) { try { DATA = JSON.parse(dataEl.textContent); } catch (e) { DATA = null; } }

  function Quiz(root, questions, exam, seconds, meta) {
    meta = meta || {};
    var idx = 0, picked = null, answers = [], timer = null, left = seconds || 0;
    var els = {
      count: $(".q-count", root), clock: $(".q-clock", root), dots: $(".dots", root), stage: $(".q-stage", root),
      sign: $(".q-sign", root), text: $(".quiz-q", root), opts: $(".opts", root), fb: $(".feedback", root),
      fbTitle: $(".fb-title", root), fbText: $(".fb-text", root), next: $(".q-next", root), hint: $(".q-hint", root),
      end: $(".score", root), num: $(".score-num", root), msg: $(".score-msg", root), recap: $(".recap", root), restart: $(".q-restart", root),
      empty: $(".q-empty", root)
    };
    function tick() {
      if (!exam) return;
      left--; drawClock();
      if (left <= 0) { stop(); idx = questions.length; render(); }
      else if (meta.onSave && left % 5 === 0) meta.onSave({ idx: idx, answers: answers, left: left });
    }
    function drawClock() {
      if (!els.clock) return;
      els.clock.hidden = !exam;
      var m = Math.max(0, Math.floor(left / 60)), s = Math.max(0, left % 60);
      els.clock.textContent = t("time") + " " + m + ":" + (s < 10 ? "0" : "") + s;
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    var recorded = false, begun = false, exited = false;
    // RKV3-04 (13/11/2026): an exam left before its score (page closed / app in background / another series) counts "e_exit" once
    function exitMark() { if (exam && meta.track && begun && !recorded && !exited && alive && idx < questions.length) { exited = true; Measure.add("e_exit"); } }
    if (exam) window.addEventListener("pagehide", exitMark);
    function start() {
      stop(); idx = 0; picked = null; answers = []; left = seconds || 0; recorded = false; exited = false;
      begun = !!meta.resume;   // a series counts as "started" at its first answer (not when the page merely shows it)
      if (meta.resume) { idx = meta.resume.idx || 0; answers = meta.resume.answers || []; left = meta.resume.left || left; meta.resume = null; }
      if (exam && questions.length) timer = setInterval(tick, 1000);
      drawClock(); render();
    }
    function dots() {
      els.dots.innerHTML = "";
      questions.forEach(function (q, i) {
        var s = document.createElement("i");
        if (!exam && answers[i] !== undefined) s.className = answers[i] === q.ok ? "ok" : "ko";
        else if (exam && answers[i] !== undefined) s.className = "done";
        else if (i === idx) s.className = "now";
        els.dots.appendChild(s);
      });
    }
    var favBtn = null, favMsg = null;
    if (meta.track) {
      var qh = $(".quiz-head", root);
      if (qh && !$(".q-fav", qh)) {
        favBtn = document.createElement("button"); favBtn.type = "button"; favBtn.className = "q-fav"; favBtn.innerHTML = "☆";
        qh.appendChild(favBtn);
        favMsg = document.createElement("p"); favMsg.className = "q-fav-msg muted"; favMsg.hidden = true; qh.parentNode.insertBefore(favMsg, qh.nextSibling);
      } else if (qh) { favBtn = $(".q-fav", qh); favMsg = $(".q-fav-msg", root); }
      if (favBtn) favBtn.onclick = function () {
        var q = questions[idx]; if (!q || !q.id) return;
        var f = Track.favs(), on = !f[q.id];
        if (on && !pass() && Object.keys(f).length >= 20) { favMsg.innerHTML = '<span></span> <a href="activer.html"></a>'; favMsg.firstChild.textContent = t("favMax"); favMsg.lastChild.textContent = t("unlock"); favMsg.hidden = false; return; }
        Track.setFav(q.id, on); favMsg.hidden = true; drawFav();
      };
    }
    /* report a question (cahier v2 § 6): sent as a "signal" message, read in gestion.html */
    var sigBox = null;
    if (meta.track && els.fb) {
      var wrapApi = root.closest("[data-api]"), sigApi = []; try { sigApi = JSON.parse(wrapApi ? wrapApi.getAttribute("data-api") : "[]"); } catch (e) {}
      $$(".q-sig", els.fb).forEach(function (o) { o.remove(); });   /* Quiz() is re-run on the same box (theme, restart): keep a single report link */
      sigBox = document.createElement("div"); sigBox.className = "q-sig";
      sigBox.innerHTML = '<button type="button" class="q-sig-btn"></button><div class="q-sig-form" hidden><label></label><select></select><textarea rows="2"></textarea><button type="button" class="btn btn-ghost q-sig-send"></button></div><p class="q-sig-msg muted" hidden></p>';
      els.fb.appendChild(sigBox);
      var sb = $(".q-sig-btn", sigBox), sf = $(".q-sig-form", sigBox), ssel = $("select", sigBox), sta = $("textarea", sigBox), ssend = $(".q-sig-send", sigBox), smsg = $(".q-sig-msg", sigBox);
      ssel.id = "sigWhy" + Math.random().toString(36).slice(2, 7); $("label", sigBox).setAttribute("for", ssel.id);
      sigBox.paint = function () {
        sb.textContent = t("sig"); $("label", sigBox).textContent = t("sigWhy"); sta.placeholder = t("sigNote"); ssend.textContent = t("sigSend");
        var v = ssel.value; ssel.innerHTML = ""; t("sigR").forEach(function (r, i) { var o = document.createElement("option"); o.value = String(i); o.textContent = r; ssel.appendChild(o); }); if (v) ssel.value = v;
        if (!smsg.hidden && smsg.dataset.k) smsg.textContent = t(smsg.dataset.k);
      };
      sigBox.reset = function () { sf.hidden = true; sb.hidden = false; smsg.hidden = true; sta.value = ""; ssel.value = "0"; };
      sigBox.paint(); listeners.push(sigBox.paint);
      sb.addEventListener("click", function () { sf.hidden = false; sb.hidden = true; ssel.focus(); });
      ssend.addEventListener("click", function () {
        var q = questions[idx]; if (!q) return;
        var why = (I18N_FR_SIG[+ssel.value] || ""), d = { kind: "signal", dev: DEV, lang: lang, box: inboxBox(true),
          msg: "[" + (q.id || "?") + "] " + why + (sta.value.trim() ? " — " + sta.value.trim() : "") + "\nQ (FR) : " + ((q.fr && q.fr.q) || "") };
        ssend.disabled = true; smsg.hidden = false; smsg.dataset.k = "cSend"; smsg.textContent = t("cSend");
        (function ask(i) {
          if (i >= sigApi.length) { ssend.disabled = false; smsg.dataset.k = "cNet"; smsg.textContent = t("cNet"); return; }
          fetch(sigApi[i], { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) })
            .then(function (r) { return r.json(); })
            .then(function (j) { ssend.disabled = false; if (j.ok) { sf.hidden = true; smsg.dataset.k = "sigOk"; smsg.textContent = t("sigOk"); } else { smsg.dataset.k = "cNet"; smsg.textContent = t("cNet"); } })
            .catch(function () { ask(i + 1); });
        })(0);
      });
    }
    function drawFav() {
      if (!favBtn) return;
      var q = questions[idx], on = !!(q && q.id && Track.favs()[q.id]);
      favBtn.hidden = !q || idx >= questions.length;
      favBtn.textContent = on ? "★" : "☆"; favBtn.setAttribute("aria-pressed", on ? "true" : "false");
      favBtn.setAttribute("aria-label", t(on ? "favDel" : "favAdd")); favBtn.title = t(on ? "favDel" : "favAdd");
    }
    function render() {
      if (favMsg) favMsg.hidden = true;
      if (sigBox && picked === null) sigBox.reset();
      if (favBtn) drawFav();
      if (!questions.length) { els.stage.hidden = true; els.end.hidden = true; if (els.empty) { els.empty.hidden = false; els.empty.textContent = t("empty"); } els.count.textContent = "0"; return; }
      if (els.empty) els.empty.hidden = true;
      var done = idx >= questions.length;
      els.stage.hidden = done; els.end.hidden = !done;
      els.count.textContent = (done ? questions.length : idx + 1) + " / " + questions.length;
      dots();
      if (done) { stop(); finish(); return; }
      var q = questions[idx], c = q[lang];
      els.sign.setAttribute("viewBox", q.vb || "0 0 100 100");
      var vis = q.svg || DATA.signs[q.sign] || "";
      els.sign.innerHTML = vis;
      els.sign.parentNode.classList.toggle("is-situation", !!q.svg);
      els.sign.parentNode.classList.toggle("no-visual", !vis);
      els.text.textContent = c.q;
      els.opts.innerHTML = "";
      c.o.forEach(function (txt, i) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "opt";
        b.innerHTML = '<span class="k">' + "ABC".charAt(i) + '</span><span class="ot"></span><span class="mark"></span>';
        b.querySelector(".ot").textContent = txt;
        var m = b.querySelector(".mark");
        if (picked !== null) {
          if (exam) { if (i === picked) b.classList.add("is-picked"); }
          else {
            b.disabled = true;
            if (i === q.ok) { b.classList.add("is-correct"); m.textContent = t("markRight"); }
            else if (i === picked) { b.classList.add("is-wrong"); m.textContent = t("markWrong"); }
          }
        }
        b.setAttribute("aria-pressed", String(picked === i));
        b.addEventListener("click", function () {
          if (!exam && picked !== null) return;
          if (!begun && meta.track) { begun = true; Measure.add(exam ? "e_start" : "t_start"); if (meta.quick) Measure.add("qk_s"); }
          picked = i; if (!exam) { answers[idx] = i; if (meta.track) Track.answer(q.id, i === q.ok, q.theme); } render();
          if (!exam) els.next.focus();
        });
        els.opts.appendChild(b);
      });
      var showNext = picked !== null;
      els.fb.hidden = exam || picked === null;
      els.hint.hidden = showNext;
      els.hint.textContent = exam ? t("examNote") : t("pick");
      els.next.hidden = !showNext;
      els.next.textContent = exam ? (idx === questions.length - 1 ? t("last") : t("validate")) : (idx === questions.length - 1 ? t("last") : t("next"));
      if (!exam && picked !== null) {
        els.fbTitle.textContent = picked === q.ok ? t("right") : t("wrong");
        els.fbText.textContent = c.e;
      }
    }
    function finish() {
      var score = 0;
      questions.forEach(function (q, i) { if (answers[i] === q.ok) score++; });
      if (meta.track && !recorded) {
        recorded = true;
        if (exam) questions.forEach(function (q, i) { if (answers[i] !== undefined) Track.answer(q.id, answers[i] === q.ok, q.theme); });
        Track.test(exam ? "exam" : "train", meta.theme, score, questions.length);
        if (meta.quick) Measure.add("qk_e");
        if (meta.onDone) meta.onDone();
      }
      els.num.textContent = score + " / " + questions.length;
      var r = score / questions.length;
      els.msg.textContent = r >= 0.85 ? t("great") : r >= 0.5 ? t("mid") : t("low");
      // ROK-06 (13/11/2026): the main button leads to the chapter that teaches the 1st mistake (else: the courses, as before)
      var learn = $(".q-learn", root);
      if (learn) {
        if (learn.dataset.def === undefined) { learn.dataset.def = learn.innerHTML; learn.dataset.href = learn.getAttribute("href"); }
        learn.innerHTML = learn.dataset.def; learn.setAttribute("href", learn.dataset.href); learn.onclick = null;
        var ch = null;   // 1st mistake that a chapter teaches: bank question, sign, or "ordre de passage" situation
        if (DATA) questions.some(function (q, i) {
          if (answers[i] === q.ok) return false;
          ch = (DATA.qch && DATA.qch[q.id]) || (q.sign && DATA.sch && DATA.sch[q.sign]) || (q.theme === "situations" && DATA.sitch) || null;
          return !!ch;
        });
        if (ch) {
          var title = "";
          try { (JSON.parse(document.getElementById("courseIndex").textContent) || []).forEach(function (th) { if (th.slug === ch[0]) th.chapters.forEach(function (c) { if (c.id === ch[1]) title = c.t[lang] || c.t.fr; }); }); } catch (e) {}
          learn.setAttribute("href", "theme-" + ch[0] + ".html#c=" + ch[1]);
          learn.textContent = title ? t("revCh") + title : t("revCh").replace(/\s*:\s*$/, "");
          learn.onclick = function () { Measure.add("rv_ch"); };
        }
      }
      if (els.recap) {
        els.recap.innerHTML = "";
        els.recap.hidden = !exam;
        if (exam) questions.forEach(function (q, i) {
          var c = q[lang], li = document.createElement("li"), ok = answers[i] === q.ok;
          li.className = ok ? "ok" : "ko";
          li.innerHTML = "<b></b><span class=\"r-y\"></span><span class=\"r-c\"></span><span class=\"r-e\"></span>";
          li.querySelector("b").textContent = (ok ? "✓ " : "✗ ") + c.q;
          li.querySelector(".r-y").textContent = t("yours") + " : " + (answers[i] === undefined ? t("none") : c.o[answers[i]]);
          li.querySelector(".r-c").textContent = t("correct") + " : " + c.o[q.ok];
          li.querySelector(".r-e").textContent = c.e;
          els.recap.appendChild(li);
        });
      }
    }
    var alive = true;
    function fresh(n) { var c = n.cloneNode(true); n.parentNode.replaceChild(c, n); return c; }
    els.next = fresh(els.next); els.restart = fresh(els.restart);
    els.next.addEventListener("click", function () {
      if (exam) answers[idx] = picked;
      idx++; picked = null; render();
      if (exam && meta.onSave && idx < questions.length) meta.onSave({ idx: idx, answers: answers, left: left });
      var f = $(".opt", root); if (f && idx < questions.length) f.focus();
    });
    els.restart.addEventListener("click", start);
    listeners.push(function () { if (alive) { render(); drawClock(); } });
    return { start: start, stop: stop, kill: function () { exitMark(); alive = false; stop(); } };
  }

  /* ---------- pass (premium) ---------- */
  function devSeed() {
    try { if (window.RokhNative && RokhNative.id) { var n = RokhNative.id(); if (n) return "a:" + n; } } catch (e) {}
    var s = null;
    try { s = localStorage.getItem("rokhssati-device"); } catch (e) {}
    if (!s) { s = "w:" + Date.now().toString(36) + Math.random().toString(36).slice(2); try { localStorage.setItem("rokhssati-device", s); } catch (e) {} }
    return s;
  }
  var DEV = RokhCode.deviceId(devSeed());
  /* a pass is {until, dev, t}: t is the server's ECDSA signature of "dev|until", checked with the public key only */
  // latest server time seen (functions/api/essai.js?info=1): turning the phone clock back does not extend a pass
  function tmax() { try { return +localStorage.getItem("rokhssati-tmax") || 0; } catch (e) { return 0; } }
  function pass() {
    try { var p = JSON.parse(localStorage.getItem("rokhssati-pass") || "null"); if (p && p.t && p.dev === DEV && p.until > Math.max(Date.now(), tmax())) return p; } catch (e) {}
    return null;
  }
  function b64u(s) { s = s.replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "="; var b = atob(s), o = new Uint8Array(b.length); for (var i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return o; }
  function verifyPass(p) {
    try {
      var cs = window.crypto && window.crypto.subtle;
      if (!cs || !p || !p.t) return Promise.resolve(false);
      return cs.importKey("jwk", ROKH_PUB, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]).then(function (k) {
        return cs.verify({ name: "ECDSA", hash: "SHA-256" }, k, b64u(p.t), new TextEncoder().encode(p.dev + "|" + p.until));
      }).catch(function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }
  (function () {
    var raw = null; try { raw = localStorage.getItem("rokhssati-pass"); } catch (e) {}
    if (!raw) return;
    var p = null; try { p = JSON.parse(raw); } catch (e) {}
    var good = pass();
    if (!good) { try { localStorage.removeItem("rokhssati-pass"); } catch (e) {} if (p && p.until > Date.now()) location.reload(); return; }
    verifyPass(good).then(function (ok) { if (!ok) { try { localStorage.removeItem("rokhssati-pass"); } catch (e) {} location.reload(); } });
    // with a pass, check the server clock (at most every 10 min)
    var last = 0; try { last = +sessionStorage.getItem("rokhssati-tchk") || 0; } catch (e) {}
    if (Date.now() - last > 600000) {
      try { sessionStorage.setItem("rokhssati-tchk", String(Date.now())); } catch (e) {}
      fetch((window.RokhNative ? "https://rokhssati.com" : "") + "/api/essai?info=1", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j || !j.now) return;
        if (j.now > tmax()) { try { localStorage.setItem("rokhssati-tmax", String(j.now)); } catch (e) {} }
        if (!pass()) { try { localStorage.removeItem("rokhssati-pass"); } catch (e) {} location.reload(); }
      }).catch(function () {});
    }
  })();
  function fmtDate(ms) { var d = new Date(ms); return d.getDate() + "/" + (d.getMonth() + 1) + "/" + d.getFullYear(); }

  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var k = Math.floor(Math.random() * (i + 1)); var x = a[i]; a[i] = a[k]; a[k] = x; } return a; }
  function mix(q) {
    var perm = shuffle([0, 1, 2].slice(0, q.fr.o.length)), out = { id: q.id, sign: q.sign, svg: q.svg, vb: q.vb, theme: q.theme, ok: perm.indexOf(q.ok) };
    ["ar", "fr", "dz"].forEach(function (k) { out[k] = { q: q[k].q, e: q[k].e, o: perm.map(function (i) { return q[k].o[i]; }) }; });
    return out;
  }
  function signQuestions() {
    var keys = Object.keys(DATA.catalog);
    return keys.map(function (key) {
      var c = DATA.catalog[key];
      var same = keys.filter(function (k) { return k !== key && DATA.catalog[k].fam === c.fam; });
      if (same.length < 2) same = keys.filter(function (k) { return k !== key; });
      var picks = shuffle(same).slice(0, 2);
      var q = { id: "sg-" + key, sign: key, theme: "signs", ok: 0 };
      ["ar", "fr", "dz"].forEach(function (k) {
        q[k] = { q: UI[k].signQ, o: [c.name[k]].concat(picks.map(function (p) { return DATA.catalog[p].name[k]; })), e: c.name[k] };
      });
      return q;
    });
  }

  if (DATA) {
    var demo = $("#quizDemo");
    if (demo) Quiz(demo, DATA.questions.slice(0, DATA.demoCount || 6).map(mix), false, 0).start();
    var trainer = $("#trainer");
    if (trainer) {
      var sel = $("#themeSel"), current = null, lockBox = $("#lockBox");
      var modes = $$("[name=mode]");
      var startBtn = $("#startBtn");
      function pool(th) {
        if (th === "signs") return signQuestions();
        if (th === "situations") return DATA.situations.slice();
        if (th === "rapide") return quick();
        if (th === "favs") { var fv = Track.favs(); return DATA.questions.concat(DATA.situations, signQuestions()).filter(function (q) { return fv[q.id]; }); }
        if (th === "all") return DATA.questions.concat(DATA.situations);
        if (th === "errors") {
          var errs = Track.errors();
          return DATA.questions.concat(DATA.situations, signQuestions()).filter(function (q) { return errs[q.id]; });
        }
        return DATA.questions.filter(function (q) { return q.theme === th; });
      }
      /* « Teste-toi en 2 minutes » (owner 08/11/2026): always the SAME 5 questions, for everyone (owner: « pas de truc
         aléatoire qui donne accès à tous »), all already free: the 1st question of 3 themes + the 1st sign + the 1st situation. */
      var QUICK_TH = ["circulation", "conducteur", "usagers"];
      function quick() {
        var first = function (th) { for (var i = 0; i < DATA.questions.length; i++) if (DATA.questions[i].theme === th) return DATA.questions[i]; return null; };
        return [first(QUICK_TH[0]), signQuestions()[0], first(QUICK_TH[1]), DATA.situations[0], first(QUICK_TH[2])].filter(Boolean);
      }
      /* lot 4 (cahier v2 § 8): mock exam balanced across themes, avoiding the last exams' questions; resumable */
      var EXK = "rokhssati-exam-run", RECENT = "rokhssati-exam-recent";
      function lsJ(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v === null || v === undefined ? d : v; } catch (e) { return d; } }
      function lsW(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
      function buildExam(th, n, only) {
        var recent = {}; lsJ(RECENT, []).forEach(function (id) { recent[id] = 1; });
        if (only) {   // custom exam: the chosen themes, shared as evenly as the bank allows
          var lists = only.map(function (k) { return { k: k, l: shuffle(pool(k)) }; }), outC = [], ii = 0;
          lists.forEach(function (o) { o.l = o.l.filter(function (q) { return !recent[q.id]; }).concat(o.l.filter(function (q) { return recent[q.id]; })); });
          while (outC.length < n && lists.some(function (o) { return o.l.length; })) { var o = lists[ii++ % lists.length]; if (o.l.length) outC.push(o.l.shift()); }
          return shuffle(outC);
        }
        function pick(list, k) {
          return shuffle(list.filter(function (q) { return !recent[q.id]; })).concat(shuffle(list.filter(function (q) { return recent[q.id]; }))).slice(0, k);
        }
        if (th !== "all") return pick(pool(th), n);
        var nSign = Math.round(n * 0.2), nSit = Math.min(DATA.situations.length, Math.round(n * 0.1)), rest = n - nSign - nSit;
        var groups = {}; DATA.questions.forEach(function (q) { (groups[q.theme] = groups[q.theme] || []).push(q); });
        var names = Object.keys(groups), total = DATA.questions.length, quota = {}, used = 0;
        names.forEach(function (k) { quota[k] = Math.min(groups[k].length, 1); used += quota[k]; });
        var extra = Math.max(0, rest - used);
        var share = names.map(function (k) { var x = extra * groups[k].length / total; return { k: k, f: x - Math.floor(x), n: Math.floor(x) }; });
        share.forEach(function (o) { quota[o.k] += o.n; used += o.n; });
        share.sort(function (a, b) { return b.f - a.f; }).forEach(function (o) { if (used < rest) { quota[o.k]++; used++; } });
        var out = pick(signQuestions(), nSign).concat(pick(DATA.situations, nSit));
        names.forEach(function (k) { out = out.concat(pick(groups[k], Math.min(quota[k], groups[k].length))); });
        return shuffle(out).slice(0, n);
      }
      function fmtLeft(sec) { var m = Math.floor(sec / 60), x = sec % 60; return m + ":" + (x < 10 ? "0" : "") + x; }
      var resumeBox = document.createElement("div"); resumeBox.className = "lock resume-box"; resumeBox.hidden = true;
      resumeBox.innerHTML = '<p class="lock-msg"></p><p class="pg-actions"><button type="button" class="btn btn-primary rs-go"></button> <button type="button" class="btn btn-ghost rs-new"></button></p>';
      var tw = trainer.closest(".trainer-wrap") || trainer.parentNode; tw.insertBefore(resumeBox, tw.firstChild);
      function drawResume() {
        var run = lsJ(EXK, null);
        if (!run || !run.qs || Date.now() - run.at > 2 * 86400000 || !pass()) { resumeBox.hidden = true; return false; }
        resumeBox.hidden = false;
        $(".lock-msg", resumeBox).textContent = t("resume").replace("%i", run.idx + 1).replace("%n", run.qs.length).replace("%t", fmtLeft(run.left));
        $(".rs-go", resumeBox).textContent = t("resumeGo"); $(".rs-new", resumeBox).textContent = t("resumeNew");
        return true;
      }
      function examMeta(th, qs, resume) {
        return { track: true, theme: th, resume: resume || null,
          onSave: function (st) { lsW(EXK, { qs: qs, th: th, idx: st.idx, answers: st.answers, left: st.left, at: Date.now() }); },
          onDone: function () {
            lsW(EXK, null); resumeBox.hidden = true;
            var r = qs.map(function (q) { return q.id; }).concat(lsJ(RECENT, [])); lsW(RECENT, r.slice(0, 90));
          } };
      }
      var cxGo = $("#cxGo");
      if (cxGo) cxGo.addEventListener("click", function () {
        var m = $(".cx-msg"), only = $$("#customEx .cx-th input").filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
        m.hidden = true;
        if (!pass()) { m.textContent = t("cxLock"); m.hidden = false; return; }
        if (!only.length) { m.textContent = t("cxNone"); m.hidden = false; return; }
        var n = +$("#cxN").value || 30, qs = buildExam("custom", n, only).map(mix);
        if (current) current.kill();
        lockBox.hidden = true; resumeBox.hidden = true; lsW(EXK, null);
        var ex = $("#modeExam"); if (ex) ex.checked = true;
        trainer.classList.add("is-exam");
        current = Quiz(trainer, qs, true, qs.length * 30, examMeta("custom", qs, null));
        current.start();
        try { trainer.scrollIntoView({ behavior: "smooth", block: "start" }); } catch (e) {}
      });
      $(".rs-go", resumeBox).addEventListener("click", function () {
        var run = lsJ(EXK, null); if (!run) return;
        Measure.add("e_res");
        if (current) current.kill();
        resumeBox.hidden = true; lockBox.hidden = true;
        var ex = $("#modeExam"); if (ex) ex.checked = true;
        trainer.classList.add("is-exam");
        current = Quiz(trainer, run.qs, true, run.qs.length * 30, examMeta(run.th, run.qs, { idx: run.idx, answers: run.answers, left: run.left }));
        current.start();
      });
      $(".rs-new", resumeBox).addEventListener("click", function () { lsW(EXK, null); resumeBox.hidden = true; var ex = $("#modeExam"); if (ex) ex.checked = true; launch(); });
      listeners.push(function () { if (!resumeBox.hidden) drawResume(); });

      function launch() {
        if (current) current.kill();
        var th = sel.value;
        var exam = (modes.filter(function (m) { return m.checked; })[0] || {}).value === "exam";
        if (th === "rapide" && exam) { exam = false; var pr = $("#modePractice"); if (pr) pr.checked = true; }
        var qs = pool(th);
        if (exam || th === "signs" || th === "all" || th === "errors" || th === "favs") qs = shuffle(qs);
        var premium = !!pass(), limit = DATA.free[th] || DATA.free.default, msg = "";
        if (!premium && exam) { qs = []; msg = t("lockExam"); }
        else if (th === "favs" && !qs.length) msg = t("favEmpty");
        else if (th === "rapide") { /* already limited to the free questions (quick()) */ }
        else if (!premium && th !== "favs") {
          // free (owner 07/11/2026): a short trial, always the same `limit` questions per category, in a random order
          var fixed = pool(th).slice(0, limit);
          if (pool(th).length > limit) msg = t("lockMore").replace("%n", limit);
          qs = shuffle(fixed);
        }
        var meta = { track: true, theme: th, quick: th === "rapide" };
        if (exam && premium) { qs = buildExam(th, 30).map(mix); meta = examMeta(th, qs, null); lsW(EXK, null); resumeBox.hidden = true; }
        else { if (exam) qs = qs.slice(0, 30); qs = qs.map(mix); }
        lockBox.hidden = !msg; $(".lock-msg", lockBox).textContent = msg;
        trainer.classList.toggle("is-exam", exam);
        current = Quiz(trainer, qs, exam, qs.length * 30, meta);
        current.start();
      }
      function fromHash() {
        var h = (location.hash || "").replace("#", "");
        if (h === "examen-blanc") { var ex = $("#modeExam"); if (ex) ex.checked = true; }
        else if (h && $("option[value=\"" + h + "\"]", sel)) sel.value = h;
      }
      fromHash();
      window.addEventListener("hashchange", function () { fromHash(); launch(); closeSubs(null); });
      startBtn.addEventListener("click", launch);
      listeners.push(function () { if (!lockBox.hidden) launch(); });
      // an unfinished mock exam: offer to resume it instead of starting a new one over it
      if (drawResume()) { var ex0 = $("#modeExam"), tr0 = $("#modePractice"); if (ex0 && ex0.checked && tr0) tr0.checked = true; }
      launch();
    }
  }

  /* ---------- activation code & payment ---------- */
  var codeBtn = $("#codeBtn");
  if (codeBtn) {
    var PASS = JSON.parse(document.getElementById("passData").textContent);
    var devEl = $("#devId"); if (devEl) devEl.textContent = DEV;
    var devCopy = $("#devCopy");
    if (devCopy) devCopy.addEventListener("click", function () {
      try { navigator.clipboard.writeText(DEV).then(function () { devCopy.textContent = "✓"; }, function () {}); } catch (e) {}
      var r = document.createRange(); r.selectNodeContents(devEl); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    });
    function showPass() {
      var p = pass(), m = $("#passState");
      m.hidden = !p; if (p) m.textContent = t("active").replace("%d", fmtDate(p.until));
    }
    codeBtn.addEventListener("click", function () {
      var raw = $("#codeIn").value || "";
      var msg = $("#codeMsg"); msg.hidden = false;
      msg.dataset.state = ""; msg.textContent = t("codeWait"); codeBtn.disabled = true;
      var ctl = window.AbortController ? new AbortController() : null, tm = setTimeout(function () { if (ctl) ctl.abort(); }, 15000);
      var qs = "?d=" + encodeURIComponent(DEV) + "&c=" + encodeURIComponent(raw.trim().slice(0, 30)), opts = ctl ? { signal: ctl.signal, cache: "no-store" } : { cache: "no-store" };
      var apis = [].concat(PASS.api);
      function ask(i) { return fetch(apis[i] + qs, opts).then(function (res) { return res.json(); }).catch(function (e) { if (i + 1 < apis.length) return ask(i + 1); throw e; }); }
      ask(0)
        .then(function (r) {
          var p = r && r.ok ? { plan: "code", until: r.until, dev: DEV, t: r.t } : null;
          return (p ? verifyPass(p) : Promise.resolve(false)).then(function (ok) {
            if (ok) {
              try { localStorage.setItem("rokhssati-pass", JSON.stringify(p)); } catch (e) {}
              msg.dataset.state = "ok"; msg.textContent = t("codeOk").replace("%d", fmtDate(p.until));
            } else {   // RKV3-11 (13/11/2026): say why, never show or log the code itself
              msg.dataset.state = "ko";
              var k = !r ? "codeNet" : r.err === "exp" ? "codeExp" : r.err === "trop" ? "codeMany" : r.err === "config" ? "codeSrv"
                : r.err === "code" || r.err === "dev" ? (r.why === "forme" ? "codeForm" : r.why === "autre" ? "codeOther" : "codeKo") : "codeNet";
              msg.textContent = t(k).replace("%dev", DEV).replace("%d", r && r.until ? fmtDate(r.until) : "");
            }
          });
        })
        .catch(function () { msg.dataset.state = "ko"; msg.textContent = t("codeNet"); })
        .then(function () { clearTimeout(tm); codeBtn.disabled = false; showPass(); });
    });
    listeners.push(showPass);
    /* launch offer: free trial for the first installs, app only (functions/api/essai.js) */
    var trialBox = $("#trialBox");
    if (trialBox) {
      var TB = window.RokhNative ? "https://rokhssati.com" : "", tBtn = $("#trialBtn"), tDl = $("#trialDl"), tLeft = $("#trialLeft"), tMsg = $("#trialMsg"), tState = null;
      var tSay = function (k, d) { tMsg.hidden = false; tMsg.dataset.k = k; tMsg.dataset.d = d || ""; tMsg.dataset.state = k === "trOk" ? "ok" : "ko"; tMsg.textContent = t(k).replace("%d", d ? fmtDate(+d) : ""); };
      var tDraw = function () {
        tBtn.hidden = !window.RokhNative || !!pass() || (tState && tState.left === 0); tDl.hidden = !!window.RokhNative;
        if (tState) { tLeft.hidden = false; tLeft.textContent = tState.left > 0 ? t("trLeft").replace("%n", tState.left) : t("trNone"); }
        if (!tMsg.hidden && tMsg.dataset.k) tSay(tMsg.dataset.k, tMsg.dataset.d);
      };
      fetch(TB + "/api/essai?info=1", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
        if (j && j.ok) { tState = j; if (j.now > tmax()) { try { localStorage.setItem("rokhssati-tmax", String(j.now)); } catch (e) {} } } tDraw();
        if (/[?&]essai=1/.test(location.search) && !tBtn.hidden && !pass()) tBtn.click();   // one tap from the welcome pop-up
      }).catch(tDraw);
      tBtn.addEventListener("click", function () {
        tBtn.disabled = true;
        fetch(TB + "/api/essai?d=" + encodeURIComponent(DEV) + "&v=" + (typeof ROKH_APP_CODE === "number" ? ROKH_APP_CODE : 0), { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (r) {
          var p = r && r.ok ? { plan: "essai", until: r.until, dev: DEV, t: r.t } : null;
          return (p ? verifyPass(p) : Promise.resolve(false)).then(function (ok) {
            if (ok) { try { localStorage.setItem("rokhssati-pass", JSON.stringify(p)); } catch (e) {} tSay("trOk", p.until); }
            else if (r && r.err === "fini") { tState = { left: 0 }; tSay("trNone"); }
            else if (r && r.err === "deja") tSay("trDeja");
            else if (r && r.err === "maj") tSay("trMaj");
            else tSay("trNet");
            if (r && typeof r.left === "number") tState = { left: r.left };
          });
        }).catch(function () { tSay("trNet"); }).then(function () { tBtn.disabled = false; tDraw(); showPass(); });
      });
      listeners.push(tDraw); tDraw();
    }
    var payForm = $("#payForm");
    if (payForm) payForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var m = $("#payMsg"); m.hidden = false;
      if (!payForm.checkValidity()) { m.dataset.state = "ko"; m.textContent = t("formKo"); return; }
      fetch("/", { method: "POST", body: new FormData(payForm) }).then(function (r) {
        m.dataset.state = r.ok ? "ok" : "ko"; m.textContent = r.ok ? t("payOk") : t("payKo");
      }).catch(function () { m.dataset.state = "ko"; m.textContent = t("payKo"); });
    });
  }

  /* ---------- speed calculator ---------- */
  var limitIn = $("#limitIn"), speedIn = $("#speedIn");
  function calc() {
    if (!limitIn) return;
    var L = parseFloat(limitIn.value), V = parseFloat(speedIn.value), out = $("#calcOut");
    $$("#presets button").forEach(function (b) { b.setAttribute("aria-pressed", String(parseFloat(b.dataset.v) === L)); });
    if (!(L > 0) || !(V >= 0)) { out.dataset.level = ""; $("#calcPct").textContent = "—"; $("#calcVerdict").textContent = t("check"); $("#calcFine").textContent = ""; return; }
    var pct = (V - L) / L * 100, level, fine;
    if (pct <= 0) { level = "ok"; fine = t("inLimit"); }
    else if (pct <= 10) { level = "d2"; fine = fmt(4000) + " " + t("cur"); }
    else if (pct <= 20) { level = "d3"; fine = fmt(6000) + " " + t("cur"); }
    else if (pct <= 30) { level = "d4"; fine = fmt(10000) + " " + t("cur"); }
    else { level = "delit"; fine = fmt(25000) + " – " + fmt(80000) + " " + t("cur"); }
    out.dataset.level = level;
    $("#calcPct").textContent = pct > 0 ? "+" + pct.toFixed(1).replace(".", lang === "fr" ? "," : ".") + " %" : "0 %";
    $("#calcVerdict").textContent = t(level);
    $("#calcFine").textContent = fine;
  }
  if (limitIn) {
    limitIn.addEventListener("input", calc); speedIn.addEventListener("input", calc);
    $$("#presets button").forEach(function (b) { b.addEventListener("click", function () { limitIn.value = b.dataset.v; calc(); }); });
    listeners.push(calc);
  }

  /* ---------- contact forms (activation code, auto-écoles, other): POST to /api/contact ---------- */
  $$(".rk-contact").forEach(function (f) {
    var api = []; try { api = JSON.parse(f.getAttribute("data-api") || "[]"); } catch (e) {}
    var m = f.querySelector(".form-msg"), busy = false;
    function show(k) { m.hidden = false; m.dataset.state = k === "cOk" ? "ok" : "ko"; m.dataset.k = k; m.textContent = t(k); }
    function opts() { $$("option[data-fr]", f).forEach(function (o) { o.textContent = o.getAttribute("data-" + lang) || o.getAttribute("data-fr"); }); }
    opts();
    listeners.push(function () { opts(); if (!m.hidden && m.dataset.k) m.textContent = t(m.dataset.k); });
    var ks = f.querySelector("select[name=kind]"), dw = f.querySelector(".dem-field");
    if (ks && dw) { var sync = function () { dw.hidden = ks.value !== "code"; }; ks.addEventListener("change", sync); sync(); }
    var dsel = f.querySelector("select[name=demande]"), star = f.querySelector(".req");
    function req() { var free = dsel && !(dw && dw.hidden) && (dsel.value === "essai-3j" || dsel.value === "mois"); if (star) star.hidden = !!free; }
    if (dsel) dsel.addEventListener("change", req); if (ks) ks.addEventListener("change", req); req();
    f.addEventListener("submit", function (e) {
      e.preventDefault(); if (busy) return;
      var d = { kind: f.getAttribute("data-kind") || "autre", dev: DEV, lang: document.documentElement.lang || "", box: inboxBox(true) };
      Array.prototype.forEach.call(f.elements, function (el) { if (el.name) d[el.name === "message" ? "msg" : el.name] = el.value.trim(); });
      var dm = f.querySelector("[name=demande]"), dmw = dm && dm.closest(".dem-field"), ta = f.querySelector("[name=message]");
      if (dm && (d.kind !== "code" || (dmw && dmw.hidden))) delete d.demande;
      if (ta) ta.required = !(d.demande === "essai-3j" || d.demande === "mois");   // a code request needs no message
      if (!f.checkValidity()) { show("formKo"); return; }
      if (d.kind === "auto-ecole" && !d.phone && !d.email) { show("formKoAE"); return; }   // phone/e-mail optional, except for driving schools
      busy = true; show("cSend");
      (function ask(i) {
        if (i >= api.length) { busy = false; show("cNet"); return; }
        fetch(api[i], { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) })
          .then(function (r) { return r.json(); })
          .then(function (j) { busy = false; if (j.ok) { f.reset(); show("cOk"); if (window.rkInbox) window.rkInbox(true); } else show(j.err === "contact" || j.err === "msg" ? "formKo" : "cNet"); })
          .catch(function () { ask(i + 1); });
      })(0);
    });
  });

  /* ---------- course: chapters, slide viewer, progress, stats ---------- */
  var CU = {
    ar: { prev: "السابق", next: "التالي", finish: "إنهاء الفصل", check: "تحقق", done: "انتهى الفصل!", doneTxt: "أحسنت. يمكنك المرور إلى الفصل الموالي.",
          nextChap: "الفصل الموالي", nextTheme: "المحور الموالي", back: "العودة إلى الفصول", train: "تدرّب على هذا المحور", right: "إجابة صحيحة", wrong: "ليس تمامًا",
          start: "ابدأ الدرس", resume: "واصل الدرس", review: "راجع من البداية", readOf: "%a من %b فصول منتهية", cont: "واصل: %t", startCourse: "ابدأ الدروس",
          k_ch: "فصول منتهية", k_tests: "اختبارات", k_avg: "المعدل", k_best: "أفضل نتيجة", k_err: "أخطاء للمراجعة", histEmpty: "لم تجر أي اختبار بعد. ابدأ سلسلة من صفحة التدريب.",
          h_date: "التاريخ", h_type: "النوع", h_theme: "المحور", h_score: "النتيجة", t_train: "تدريب", t_exam: "امتحان تجريبي", t_livre: "اختبار الكتاب",
          all: "كل المحاور", rapide: "اختبار دقيقتين", custom: "امتحان مخصّص", favs: "مفضلتي", signs: "الإشارات", situations: "ترتيب المرور", errors: "أخطائي", reset: "مسح كل التقدم", resetSure: "متأكد؟ اضغط مرة أخرى",
          noErr: "لا توجد أخطاء للمراجعة.", days: ["أحد", "إثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"], step: "بطاقة", thDone: "أنهيت هذا المحور!", thDoneTxt: "اختبر نفسك الآن على أسئلته.", thFree: "3 أسئلة تجريبية مجانية؛ كل الأسئلة والامتحانات التجريبية في البريميوم، مُهدى خلال الإطلاق (تجربة 3 أيام أو رمز).",
          wk_t: "نقاط الضعف", wk_none: "أجب على 3 أسئلة على الأقل في محور لنحلّل نتائجك.", wk_rev: "راجع الدرس", wk_tr: "تدرّب", wk_q: "أجوبة", wk_free: "النسخة المجانية: المحور الأضعف فقط. تحليل كل المحاور في البريميوم، مُهدى خلال الإطلاق (تجربة 3 أيام أو رمز).", wk_first: "للمراجعة أولًا", k_more: "إحصائيات مفصّلة", prem: "بريميوم (مُهدى خلال الإطلاق)", bkCopied: "تم نسخ الرمز. احفظه في مكان آمن (رسالة لنفسك مثلًا).", bkSure: "سيُستبدل تقدمك الحالي. اضغط مرة أخرى للتأكيد.", bkOk: "تم استرجاع تقدمك.", bkBad: "هذا الرمز غير صالح. انسخه كاملًا.", histFree: "النسخة المجانية: آخر 3 نتائج فقط. السجل الكامل والمعدل وأفضل نتيجة في البريميوم، مُهدى خلال الإطلاق (تجربة 3 أيام أو رمز)." },
    fr: { prev: "Précédent", next: "Suivant", finish: "Terminer le chapitre", check: "Vérifier", done: "Chapitre terminé !", doneTxt: "Bravo. Vous pouvez passer au chapitre suivant.",
          nextChap: "Chapitre suivant", nextTheme: "Thème suivant", back: "Retour aux chapitres", train: "S'entraîner sur ce thème", right: "Bonne réponse", wrong: "Pas tout à fait",
          start: "Commencer le cours", resume: "Reprendre le cours", review: "Revoir depuis le début", readOf: "%a sur %b chapitres terminés", cont: "Reprendre : %t", startCourse: "Commencer les cours",
          k_ch: "Chapitres terminés", k_tests: "Tests passés", k_avg: "Moyenne", k_best: "Meilleur score", k_err: "Erreurs à revoir", histEmpty: "Aucun test pour l'instant. Lancez une série depuis la page Entraînement.",
          h_date: "Date", h_type: "Type", h_theme: "Thème", h_score: "Score", t_train: "Entraînement", t_exam: "Examen blanc", t_livre: "Test du livre",
          all: "Tous les thèmes", rapide: "Test 2 minutes", custom: "Examen personnalisé", favs: "Mes favoris", signs: "Panneaux", situations: "Ordre de passage", errors: "Mes erreurs", reset: "Effacer ma progression", resetSure: "Sûr ? Cliquez encore",
          noErr: "Aucune erreur à revoir.", days: ["dim", "lun", "mar", "mer", "jeu", "ven", "sam"], step: "Fiche", thDone: "Thème terminé !", thDoneTxt: "Testez-vous maintenant sur ses questions.", thFree: "3 questions d'essai gratuites ; toutes les questions et les examens blancs avec le Premium, offert pendant le lancement (essai 3 jours ou code).",
          wk_t: "Points faibles", wk_none: "Répondez à au moins 3 questions d'un thème pour que nous analysions vos résultats.", wk_rev: "Revoir le cours", wk_tr: "S'entraîner", wk_q: "réponses", wk_free: "Version gratuite : seulement le thème le plus faible. L'analyse de tous les thèmes avec le Premium, offert pendant le lancement (essai 3 jours ou code).", wk_first: "À revoir en priorité", k_more: "Statistiques détaillées", prem: "Premium (offert pendant le lancement)", bkCopied: "Code copié. Gardez-le en lieu sûr (par exemple dans un message à vous-même).", bkSure: "Votre progression actuelle sera remplacée. Touchez encore pour confirmer.", bkOk: "Progression restaurée.", bkBad: "Ce code n'est pas valide. Copiez-le en entier.", histFree: "Version gratuite : seulement les 3 derniers résultats. Historique complet, moyenne et meilleur score avec le Premium, offert pendant le lancement (essai 3 jours ou code)." },
    dz: { prev: "اللي قبل", next: "اللي بعد", finish: "كمّل الفصل", check: "شوف", done: "كملت الفصل!", doneTxt: "برافو. تقدر تفوت للفصل اللي جاي.",
          nextChap: "الفصل اللي جاي", nextTheme: "المحور اللي جاي", back: "ارجع للفصول", train: "تدرّب على هاد المحور", right: "صحيح!", wrong: "ماشي هاكا",
          start: "ابدا الدرس", resume: "كمّل الدرس", review: "عاود من الأول", readOf: "%a من %b فصول كملتهم", cont: "كمّل: %t", startCourse: "ابدا الدروس",
          k_ch: "فصول كملتهم", k_tests: "الاختبارات", k_avg: "المعدل", k_best: "أحسن نتيجة", k_err: "غلطات تعاودهم", histEmpty: "مازال ما درت حتى اختبار. ابدا سلسلة من صفحة التدريب.",
          h_date: "النهار", h_type: "النوع", h_theme: "المحور", h_score: "النتيجة", t_train: "تدريب", t_exam: "امتحان تجريبي", t_livre: "اختبار الكتاب",
          all: "كامل المحاور", rapide: "تيست دقيقتين", custom: "امتحان على كيفك", favs: "المفضلة تاعي", signs: "البانوات", situations: "شكون يفوت الأول", errors: "الغلطات تاعي", reset: "امسح كلش", resetSure: "متأكد؟ اضغط مرة أخرى",
          noErr: "ما كانش غلطات تعاودهم.", days: ["حد", "تنين", "ثلاث", "ربع", "خميس", "جمعة", "سبت"], step: "بطاقة", thDone: "كمّلت هاد المحور!", thDoneTxt: "جرّب روحك دروك على الأسئلة تاعو.", thFree: "3 أسئلة بلاش باش تجرّب؛ كامل الأسئلة والامتحانات في البريميوم، بلاش في الإطلاق (تجربة 3 أيام ولا كود).",
          wk_t: "النقاط الضعيفة", wk_none: "جاوب على 3 أسئلة على الأقل في محور باش نحلّلو النتائج تاعك.", wk_rev: "عاود الدرس", wk_tr: "تدرّب", wk_q: "أجوبة", wk_free: "النسخة بلاش: غير المحور الأضعف. تحليل كامل المحاور في البريميوم، بلاش في الإطلاق (تجربة 3 أيام ولا كود).", wk_first: "راجعو قبل", k_more: "إحصائيات مفصّلة", prem: "بريميوم (بلاش في وقت الإطلاق)", bkCopied: "الكود تنسخ. خبّيه في بلاصة آمنة (ميساج لروحك مثلًا).", bkSure: "التقدم تاعك دروك راح يتبدّل. اضغط مرة أخرى باش تأكد.", bkOk: "التقدم تاعك رجع.", bkBad: "هاد الكود ماشي صحيح. انسخو كامل.", histFree: "النسخة بلاش: غير آخر 3 نتائج. السجل كامل والمعدل وأحسن نتيجة في البريميوم، بلاش في الإطلاق (تجربة 3 أيام ولا كود)." }
  };
  var u = function (k) { return CU[lang][k]; };
  var CI = null;
  try { CI = JSON.parse(document.getElementById("courseIndex").textContent); } catch (e) { CI = null; }
  function chapInfo(id) {
    if (!CI) return null;
    for (var i = 0; i < CI.length; i++) for (var j = 0; j < CI[i].chapters.length; j++)
      if (CI[i].chapters[j].id === id) return { theme: CI[i], ti: i, c: CI[i].chapters[j], ci: j };
    return null;
  }
  function frac(p, c) { return p.done[c.id] ? 1 : Math.min(1, (p.read[c.id] || 0) / c.n); }
  function themeStats(th, p) {
    var done = 0, f = 0;
    th.chapters.forEach(function (c) { if (p.done[c.id]) done++; f += frac(p, c); });
    return { done: done, total: th.chapters.length, pct: th.chapters.length ? f / th.chapters.length : 0 };
  }
  function globalStats(p) {
    var done = 0, tot = 0, f = 0;
    (CI || []).forEach(function (th) { th.chapters.forEach(function (c) { tot++; if (p.done[c.id]) done++; f += frac(p, c); }); });
    return { done: done, total: tot, pct: tot ? f / tot : 0 };
  }
  function nextChapter(p) {
    if (p.last) {
      var inf = chapInfo(p.last.chap);
      if (inf && !p.done[inf.c.id] && !lockedId(inf.c.id)) return inf;
    }
    if (!CI) return null;
    for (var i = 0; i < CI.length; i++) for (var j = 0; j < CI[i].chapters.length; j++)
      if (!p.done[CI[i].chapters[j].id] && !lockedId(CI[i].chapters[j].id)) return { theme: CI[i], ti: i, c: CI[i].chapters[j], ci: j };
    return null;
  }
  function chapHref(inf) { return inf.theme.url + "#c=" + inf.c.id; }
  /* free version: the first FREE_CHAPS chapters of each theme; the next ones open with an activation code */
  var FREE_CHAPS = Infinity;   // owner 07/11/2026: every course chapter is free (the lock code stays, unused)
  function lockedId(id) { var inf = chapInfo(id); return !!inf && inf.ci >= FREE_CHAPS && !pass(); }
  var LKU = {
    ar: { t: "هذا الفصل يُفتح برمز التفعيل", p: "الفصول الستة الأولى من كل محور مجانية. أدخل رمز التفعيل لفتح باقي الفصول." },
    fr: { t: "Ce chapitre s'ouvre avec un code d'activation", p: "Les 6 premiers chapitres de chaque thème sont gratuits. Activez un code pour ouvrir les suivants." },
    dz: { t: "هاد الفصل يتحل بكود التفعيل", p: "الفصول الستة الأولين من كل محور بلاش. فعّل الكود باش تحل الباقي." }
  };
  function setRing(el, pct) {
    if (!el) return;
    var v = Math.round(pct * 100);
    el.style.setProperty("--p", v);
    var b = el.querySelector("b"); if (b) b.textContent = v + "%";
  }
  function themeName(slug) {
    if (CI) for (var i = 0; i < CI.length; i++) if (CI[i].slug === slug) return CI[i].name[lang];
    return u(slug) || slug;
  }
  function streakCount(days) {
    var set = {}; days.forEach(function (d) { set[d] = 1; });
    var d = new Date(), n = 0;
    if (!set[Track.day(d)]) d.setDate(d.getDate() - 1);
    while (set[Track.day(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function drawStreak(box) {
    if (!box) return;
    var days = Track.days(), set = {}; days.forEach(function (x) { set[x] = 1; });
    var ol = $(".st-days", box); ol.innerHTML = "";
    for (var k = 5; k >= -1; k--) {
      var d = new Date(); d.setDate(d.getDate() - k);
      var li = document.createElement("li");
      if (set[Track.day(d)]) li.className = "on";
      if (k === 0) li.className += " today";
      li.innerHTML = "<i></i><span></span>";
      li.querySelector("span").textContent = u("days")[d.getDay()];
      ol.appendChild(li);
    }
    $(".st-count b", box).textContent = streakCount(days);
  }

  /* theme cards on home / hub */
  function drawCards() {
    var p = Track.prog();
    $$(".tc-prog").forEach(function (el) {
      if (!CI) return;
      var th = CI.filter(function (x) { return x.slug === el.dataset.theme; })[0]; if (!th) return;
      var st = themeStats(th, p);
      el.querySelector("i").style.width = Math.round(st.pct * 100) + "%";
      el.classList.toggle("full", st.done === st.total);
      el.setAttribute("title", st.done + "/" + st.total);
    });
  }
  drawCards();

  /* hub dashboard */
  var hubRing = $("#hubRing");
  function drawHub() {
    if (!hubRing) return;
    var p = Track.prog(), g = globalStats(p), nx = nextChapter(p), btn = $("#hubResume"), last = $("#hubLast");
    setRing(hubRing, g.pct);
    if (nx) {
      btn.href = chapHref(nx);
      var started = Object.keys(p.read).length > 0;
      btn.textContent = started ? u("resume") : u("startCourse");
      last.hidden = !started;
      last.textContent = (nx.ti + 1) + "." + (nx.ci + 1) + " · " + nx.c.t[lang];
    } else { btn.href = "entrainement.html#examen-blanc"; btn.textContent = u("t_exam"); last.hidden = true; }
    drawStreak($("#streak"));
  }
  if (hubRing) { drawHub(); listeners.push(drawHub); }

  /* theme page: chapter list + viewer */
  var viewer = $("#viewer");
  if (viewer) {
    app.classList.add("has-viewer");
    var chaps = $$(".chap");
    var stage = $(".v-stage", viewer), steps = $(".v-steps", viewer), vPrev = $(".v-prev", viewer), vNext = $(".v-next", viewer);
    var cur = { li: null, slides: [], i: 0, opener: null };
    function drawList() {
      var p = Track.prog(), doneN = 0;
      chaps.forEach(function (li) {
        var id = li.dataset.chap, n = +li.dataset.n, r = p.done[id] ? n : Math.min(n, p.read[id] || 0);
        if (p.done[id]) doneN++;
        li.classList.toggle("is-done", !!p.done[id]);
        li.classList.toggle("is-started", !p.done[id] && r > 0);
        $(".cbar i", li).style.width = Math.round(r / n * 100) + "%";
        $(".cstate", li).textContent = p.done[id] ? "✓" : r > 0 ? Math.round(r / n * 100) + "%" : "";
        var lk = lockedId(id);
        li.classList.toggle("is-locked", lk);
        if (lk) $(".cstate", li).textContent = "🔒";
        var ob = $(".chap-open", li); if (ob) { if (lk) ob.setAttribute("aria-description", LKU[lang].t); else ob.removeAttribute("aria-description"); }
      });
      var tp = $(".th-progress");
      if (tp) {
        $(".pbar i", tp).style.width = Math.round(doneN / chaps.length * 100) + "%";
        $(".tp-txt", tp).textContent = u("readOf").replace("%a", doneN).replace("%b", chaps.length);
        var started = chaps.some(function (li) { return (p.read[li.dataset.chap] || 0) > 0; });
        $(".tp-resume", tp).textContent = doneN === chaps.length ? u("review") : started ? u("resume") : u("start");
      }
    }
    function open(li, i, opener) {
      cur.li = li; cur.opener = opener || null;
      cur.locked = lockedId(li.dataset.chap);
      if (!cur.locked) Measure.once("co:" + li.dataset.chap);
      cur.slides = cur.locked ? [] : $$(".slide", li);
      var n = cur.slides.length;
      cur.i = Math.max(0, Math.min(i || 0, n));
      steps.innerHTML = "";
      for (var k = 0; k < n; k++) steps.appendChild(document.createElement("i"));
      $(".v-num", viewer).textContent = $(".cnum", li).textContent;
      $(".v-title", viewer).innerHTML = $(".ctitle", li).innerHTML;
      viewer.hidden = false; document.documentElement.classList.add("v-open");
      try { history.replaceState(null, "", "#c=" + li.dataset.chap); } catch (e) {}
      render(); vNext.focus();
    }
    function close() {
      viewer.hidden = true; document.documentElement.classList.remove("v-open");
      try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}
      drawList();
      if (cur.li) { var b = $(".chap-open", cur.li); if (b) b.focus(); }
    }
    function save() {
      if (cur.locked) return;
      var n = cur.slides.length;
      Track.read(cur.li.dataset.theme, cur.li.dataset.chap, Math.min(n, cur.i + 1), n);
    }
    function wireQ(node) {
      var ok = +node.dataset.ok, qid = node.dataset.qid;
      $$(".cq-opt", node).forEach(function (b) {
        b.addEventListener("click", function () {
          if (node.classList.contains("answered")) return;
          node.classList.add("answered");
          var k = +b.dataset.k, good = k === ok;
          $$(".cq-opt", node).forEach(function (o) {
            o.disabled = true;
            if (+o.dataset.k === ok) o.classList.add("is-correct");
            else if (o === b) o.classList.add("is-wrong");
          });
          var fb = $(".cq-fb", node); fb.hidden = false;
          $(".cq-res", node).textContent = good ? u("right") : u("wrong");
          Track.chapQ(qid, good);
          vNext.focus();
        });
      });
    }
    function endCard() {
      var li = cur.li, idx = chaps.indexOf(li), nxt = chaps[idx + 1];
      var inf = chapInfo(li.dataset.chap), nextTh = inf && CI[inf.ti + 1];
      var box = document.createElement("div"); box.className = "v-end";
      box.innerHTML = '<div class="v-badge">✓</div><h3></h3><p class="muted"></p><div class="v-end-btns"></div>';
      $("h3", box).textContent = u("done"); $("p", box).textContent = u("doneTxt");
      var btns = $(".v-end-btns", box);
      if (!nxt) {   // last chapter of the theme: send the learner to practice (owner 07/11/2026)
        $("h3", box).textContent = u("thDone"); $("p", box).textContent = u("thDoneTxt");
        var tr = document.createElement("a"); tr.className = "btn btn-primary v-train"; tr.href = "entrainement.html#" + li.dataset.theme; tr.textContent = u("train"); btns.appendChild(tr);
        if (!pass()) { var fr = document.createElement("p"); fr.className = "muted v-free"; fr.innerHTML = '<span></span> <a href="activer.html"></a>';
          fr.firstChild.textContent = u("thFree"); fr.lastChild.textContent = t("unlock"); box.appendChild(fr); }
        if (nextTh) { var an = document.createElement("a"); an.className = "btn btn-ghost"; an.href = nextTh.url + "#c=" + nextTh.chapters[0].id; an.textContent = u("nextTheme"); btns.appendChild(an); }
        var bb = document.createElement("button"); bb.type = "button"; bb.className = "btn btn-ghost"; bb.textContent = u("back");
        bb.addEventListener("click", close); btns.appendChild(bb);
        return box;
      }
      if (nxt) {
        var b1 = document.createElement("button"); b1.type = "button"; b1.className = "btn btn-primary"; b1.textContent = u("nextChap");
        b1.addEventListener("click", function () { open(nxt, 0); }); btns.appendChild(b1);
      } else if (nextTh) {
        var a1 = document.createElement("a"); a1.className = "btn btn-primary"; a1.href = nextTh.url + "#c=" + nextTh.chapters[0].id; a1.textContent = u("nextTheme"); btns.appendChild(a1);
      }
      var a2 = document.createElement("a"); a2.className = "btn btn-ghost"; a2.href = "entrainement.html#" + li.dataset.theme; a2.textContent = u("train"); btns.appendChild(a2);
      var b3 = document.createElement("button"); b3.type = "button"; b3.className = "btn btn-ghost"; b3.textContent = u("back");
      b3.addEventListener("click", close); btns.appendChild(b3);
      return box;
    }
    function lockCard() {
      var box = document.createElement("div");
      box.className = "v-end v-lock";
      box.innerHTML = '<div class="v-badge" aria-hidden="true">🔒</div><h3></h3><p class="muted"></p><div class="v-end-btns"></div>';
      $("h3", box).textContent = LKU[lang].t;
      $("p", box).textContent = LKU[lang].p;
      var btns = $(".v-end-btns", box);
      var a = document.createElement("a"); a.className = "btn btn-primary"; a.href = "activer.html"; a.textContent = t("unlock"); btns.appendChild(a);
      var b = document.createElement("button"); b.type = "button"; b.className = "btn btn-ghost"; b.textContent = u("back"); b.addEventListener("click", close); btns.appendChild(b);
      return box;
    }
    function render() {
      if (cur.locked) {
        stage.innerHTML = ""; stage.appendChild(lockCard()); stage.scrollTop = 0;
        $(".v-count", viewer).textContent = "🔒";
        vPrev.textContent = u("prev"); vPrev.disabled = true; vNext.hidden = true;
        var al = $(".v-lock .btn-primary", stage); if (al) al.focus();
        return;
      }
      var n = cur.slides.length, end = cur.i >= n;
      stage.innerHTML = "";
      if (end) stage.appendChild(endCard());
      else { var ob = cur.li && $(".cobj", cur.li); if (ob) stage.appendChild(ob.cloneNode(true)); var node = cur.slides[cur.i].cloneNode(true); stage.appendChild(node); $$(".s-check", node).forEach(initCheck); if (node.classList.contains("slide-q")) wireQ(node); }
      stage.scrollTop = 0;
      $$("i", steps).forEach(function (s, k) { s.className = k < cur.i ? "seen" : k === cur.i ? "now" : ""; });
      $(".v-count", viewer).textContent = end ? n + " / " + n : (cur.i + 1) + " / " + n;
      vPrev.textContent = u("prev"); vPrev.disabled = cur.i === 0;
      vNext.hidden = end;
      vNext.textContent = cur.i === n - 1 ? u("finish") : u("next");
      save();
    }
    function go(d) {
      var n = cur.slides.length;
      cur.i = Math.max(0, Math.min(n, cur.i + d));
      render();
    }
    vNext.addEventListener("click", function () { go(1); });
    vPrev.addEventListener("click", function () { go(-1); });
    $(".v-close", viewer).addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (viewer.hidden) return;
      var rtl = app.getAttribute("dir") === "rtl";
      if (e.key === "Escape") close();
      else if (e.key === (rtl ? "ArrowLeft" : "ArrowRight")) go(1);
      else if (e.key === (rtl ? "ArrowRight" : "ArrowLeft")) go(-1);
    });
    var tx = null, ty = null;
    stage.addEventListener("touchstart", function (e) { var t0 = e.changedTouches[0]; tx = t0.clientX; ty = t0.clientY; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (tx === null) return;
      var t1 = e.changedTouches[0], dx = t1.clientX - tx, dy = t1.clientY - ty; tx = null;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      var rtl = app.getAttribute("dir") === "rtl";
      go((dx < 0) !== rtl ? 1 : -1);
    }, { passive: true });
    chaps.forEach(function (li) {
      $(".chap-open", li).addEventListener("click", function () {
        var p = Track.prog(), n = +li.dataset.n, r = p.read[li.dataset.chap] || 0;
        open(li, p.done[li.dataset.chap] || r >= n ? 0 : Math.max(0, r - 1));
      });
    });
    var tpBtn = $(".tp-resume");
    if (tpBtn) tpBtn.addEventListener("click", function () {
      var p = Track.prog();
      var li = chaps.filter(function (c) { return !p.done[c.dataset.chap] && !lockedId(c.dataset.chap); })[0] || chaps[0];
      var r = p.read[li.dataset.chap] || 0;
      open(li, p.done[li.dataset.chap] ? 0 : Math.max(0, r - 1));
    });
    function fromHash() {
      var m = /^#c=([\w-]+)/.exec(location.hash || "");
      if (!m) return;
      var li = document.getElementById(m[1]);
      if (li && li.classList.contains("chap")) {
        var p = Track.prog(), r = p.read[m[1]] || 0;
        open(li, p.done[m[1]] ? 0 : Math.max(0, r - 1));
      }
    }
    window.addEventListener("hashchange", fromHash);
    drawList(); fromHash();
    listeners.push(function () {
      drawList();
      if (!viewer.hidden) { $(".v-title", viewer).innerHTML = $(".ctitle", cur.li).innerHTML; var keepI = cur.i; cur.i = keepI; render(); }
    });
  }

  /* progression page */
  var pgRing = $("#pgRing");
  /* lot 4 (cahier v2 § 8.3): success rate per theme from training and exams; full analysis = premium */
  function drawWeak() {
    var box = $("#pgWeak"); if (!box) return;
    var ts = Track.tstats(), premium = !!pass();
    var names = {}; (CI || []).forEach(function (th) { names[th.slug] = { n: th.name[lang] || th.name.fr, url: th.url }; });
    names.signs = { n: ({ ar: "الإشارات", fr: "Panneaux", dz: "البانوات" })[lang], url: "panneaux.html" };
    names.situations = { n: ({ ar: "ترتيب المرور", fr: "Ordre de passage", dz: "شكون يفوت الأول" })[lang], url: "theme-circulation.html" };
    var rows = Object.keys(ts).filter(function (k) { return names[k] && ts[k].r + ts[k].w >= 3; })
      .map(function (k) { var n = ts[k].r + ts[k].w; return { k: k, n: n, p: ts[k].r / n }; })
      .sort(function (a, b) { return a.p - b.p; });
    box.innerHTML = "";
    if (!rows.length) { var p0 = document.createElement("p"); p0.className = "muted"; p0.innerHTML = '<span></span> <a href="entrainement.html"></a>'; p0.firstChild.textContent = u("wk_none"); p0.lastChild.textContent = u("wk_tr") + " →"; box.appendChild(p0); return; }
    (premium ? rows : rows.slice(0, 1)).forEach(function (r, i) {
      var d = document.createElement("div"); d.className = "wk-row" + (r.p < 0.7 ? " is-low" : "");
      d.innerHTML = '<div class="wk-head"><b></b><span class="wk-pct" dir="ltr"></span></div><div class="bar"><i></i></div><p class="wk-meta"><small></small> <a class="wk-c"></a> · <a class="wk-t"></a></p>';
      d.querySelector("b").textContent = names[r.k].n + (i === 0 && r.p < 0.85 ? " — " + u("wk_first") : "");
      d.querySelector(".wk-pct").textContent = Math.round(r.p * 100) + "%";
      d.querySelector(".bar i").style.width = Math.round(r.p * 100) + "%";
      d.querySelector("small").textContent = r.n + " " + u("wk_q");
      var c = d.querySelector(".wk-c"); c.href = names[r.k].url; c.textContent = u("wk_rev");
      var tr = d.querySelector(".wk-t"); tr.href = "entrainement.html#" + r.k; tr.textContent = u("wk_tr");
      box.appendChild(d);
    });
    if (!premium && rows.length > 1) { var f = document.createElement("p"); f.className = "muted hist-free"; f.innerHTML = '<span></span> <a href="activer.html"></a>';
      f.firstChild.textContent = u("wk_free"); f.lastChild.textContent = t("unlock"); box.appendChild(f); }
  }
  // 13/11/2026: "Prochaine étape" card + where the learner is on the 5-step route (test, cours, entraînement, examen blanc, jour J)
  function drawNext(p, h, empty) {
    var box = $("#pgNext");
    if (!box) { box = document.createElement("div"); box.id = "pgNext"; box.className = "pg-next"; var top = pgRing.closest(".stats-top"); top.parentNode.insertBefore(box, top); }
    box.hidden = !!empty; if (empty) return;
    var list = []; (CI || []).forEach(function (th, ti) { th.chapters.forEach(function (c, j) { list.push({ th: th, c: c, n: (ti + 1) + "." + (j + 1) }); }); });
    var L = p.last, i = -1; if (L && L.chap) list.some(function (x, k) { if (x.c.id === L.chap) { i = k; return true; } return false; });
    if (i < 0 || p.done[list[i].c.id]) { var j = i + 1; while (j < list.length && p.done[list[j].c.id]) j++; if (j >= list.length) j = list.findIndex(function (x) { return !p.done[x.c.id]; }); i = j; }
    var nx = i >= 0 && i < list.length ? list[i] : null;
    var types = {}; h.forEach(function (x) { types[x.kind || x.type || ""] = 1; });
    var quick = h.some(function (x) { return /rapide|quick/.test(String(x.theme || x.th || "")); }) || !!(Track.tstats && Object.keys(Track.tstats()).length);
    var exam = h.some(function (x) { return /exam/.test(String(x.mode || x.kind || x.type || "")); });
    var train = h.some(function (x) { return !/rapide|quick/.test(String(x.theme || x.th || "")) && !/exam/.test(String(x.mode || x.kind || x.type || "")); });
    var cur = !quick ? 0 : !Object.keys(p.done || {}).length ? 1 : !train ? 2 : !exam ? 3 : 4;
    var N = { ar: ["خطوتك التالية", "تابع", "طريقك نحو الرخصة", ["اختبر مستواك", "تعلّم", "تدرّب", "امتحان تجريبي", "اليوم الموعود"], "أكملت كل الدروس ✓ تابع التدرّب والامتحانات التجريبية."],
              fr: ["Prochaine étape", "Continuer", "Votre route vers le permis", ["Tester mon niveau", "Apprendre", "S'entraîner", "Examen blanc", "Le jour J"], "Tous les chapitres sont terminés ✓ Continuez l'entraînement et les examens blancs."],
              dz: ["الخطوة الجاية", "كمّل", "الطريق تاعك للبرمي", ["جرّب مستواك", "تعلّم", "تدرّب", "امتحان تجريبي", "النهار الكبير"], "كمّلت كامل الدروس ✓ كمّل التدريب والامتحانات التجريبية."] }[lang] || [];
    var U = ["entrainement.html#rapide", "code-de-la-route.html", "entrainement.html", "entrainement.html#examen-blanc", "permis.html#examens"];
    box.innerHTML = '<p class="pg-next-k"></p><a class="pg-next-c"><b></b><small></small><span class="btn btn-primary"></span></a><p class="pg-route-k"></p><ol class="pg-route"></ol>';
    box.querySelector(".pg-next-k").textContent = N[0];
    var a = box.querySelector(".pg-next-c");
    if (nx) { a.href = nx.th.url + "#c=" + nx.c.id; a.querySelector("b").textContent = nx.n + " " + (nx.c.t[lang] || nx.c.t.fr); a.querySelector("small").textContent = nx.th.name[lang] || nx.th.name.fr; a.querySelector(".btn").textContent = "▶ " + N[1]; }
    else { a.href = U[3]; a.querySelector("b").textContent = N[4]; a.querySelector(".btn").textContent = "▶ " + N[3][3]; }
    a.onclick = function () { Measure.add("pg_next"); };
    box.querySelector(".pg-route-k").textContent = N[2];
    var ol = box.querySelector(".pg-route");
    N[3].forEach(function (lab, k) { var li = document.createElement("li"); li.className = k < cur ? "is-done" : k === cur ? "is-now" : ""; li.innerHTML = '<a><span class="d"></span><span class="l"></span></a>'; li.querySelector("a").href = U[k]; li.querySelector(".d").textContent = k < cur ? "✓" : k + 1; li.querySelector(".l").textContent = lab; ol.appendChild(li); });
  }
  function drawStats() {
    if (!pgRing) return;
    var p = Track.prog(), g = globalStats(p), h = Track.history(), errs = Object.keys(Track.errors()).length;
    setRing(pgRing, g.pct);
    // audit PO (P2), 13/11/2026: a new learner sees where to start instead of a bare "0 %"
    var empty = !g.done && !h.length && !Object.keys(p.read || {}).length, eb = $("#pgEmpty");
    if (empty && !eb) {
      eb = document.createElement("div"); eb.id = "pgEmpty"; eb.className = "pg-empty";
      eb.innerHTML = '<p></p><p class="pg-actions"><a class="btn btn-primary" href="entrainement.html#rapide"></a> <a class="btn btn-ghost" href="code-de-la-route.html"></a></p>';
      var top = pgRing.closest(".stats-top"); top.parentNode.insertBefore(eb, top);
    }
    if (eb) {
      eb.hidden = !empty;
      var E = { ar: ["سيظهر تقدّمك هنا. ابدأ باختبار من دقيقتين أو بأول درس.", "⏱ اختبر نفسك في دقيقتين", "📘 الدروس"], fr: ["Votre progression apparaîtra ici. Commencez par le test de 2 minutes ou par un premier chapitre.", "⏱ Teste-toi en 2 minutes", "📘 Les cours"], dz: ["التقدّم تاعك يبان هنا. ابدا بتاست تاع دقيقتين ولا بأول درس.", "⏱ جرّب روحك في دقيقتين", "📘 الدروس"] }[lang] || [];
      var ps = eb.querySelectorAll("p, a"); ps[0].textContent = E[0]; ps[2].textContent = E[1]; ps[3].textContent = E[2];
    }
    drawNext(p, h, empty);
    var pcts = h.map(function (x) { return x.score / x.total; });
    var avg = pcts.length ? pcts.reduce(function (a, b) { return a + b; }, 0) / pcts.length : 0;
    var best = pcts.length ? Math.max.apply(null, pcts) : 0;
    drawWeak();
    var premium = !!pass();   // owner 07/11/2026: detailed stats and the full history are premium
    var k = premium ? [[u("k_ch"), g.done + " / " + g.total], [u("k_tests"), h.length], [u("k_avg"), pcts.length ? Math.round(avg * 100) + "%" : "—"],
             [u("k_best"), pcts.length ? Math.round(best * 100) + "%" : "—"], [u("k_err"), errs]]
           : [[u("k_ch"), g.done + " / " + g.total], [u("k_tests"), h.length], [u("k_err"), errs], [u("k_more"), u("prem")]];
    var dl = $("#pgKpis"); dl.innerHTML = "";
    k.forEach(function (x) { var d = document.createElement("div"); d.innerHTML = "<dt></dt><dd dir=\"ltr\"></dd>"; d.querySelector("dt").textContent = x[0]; d.querySelector("dd").textContent = x[1]; dl.appendChild(d); });
    if (!premium) { var lastDd = dl.lastChild.querySelector("dd"); lastDd.className = "is-prem"; lastDd.removeAttribute("dir"); lastDd.innerHTML = '<a href="activer.html"></a>'; lastDd.firstChild.textContent = u("prem"); }
    // 13/11/2026 (propriétaire « go ») : chaque thème mène à son prochain chapitre ; 2 barres = chapitres lus / bonnes réponses
    var box = $("#pgThemes"), ts = Track.tstats(); box.innerHTML = "";
    var PT = { ar: ["التالي: ", "الأجوبة الصحيحة: ", "تمّ ✓", "لا أجوبة بعد"], fr: ["Prochain : ", "Bonnes réponses : ", "Terminé ✓", "Pas encore de réponses"], dz: ["الجاي: ", "الأجوبة الصحاح: ", "كملت ✓", "مازال ما جاوبتش"] }[lang] || [];
    (CI || []).forEach(function (th, i) {
      var st = themeStats(th, p), a = document.createElement("a"), nx = null, num = 0;
      th.chapters.some(function (c, j) { if (!p.done[c.id]) { nx = c; num = j + 1; return true; } return false; });
      a.className = "pg-th"; a.href = nx ? th.url + "#c=" + nx.id : th.url;
      a.innerHTML = '<span class="tcode" aria-hidden="true"></span><span class="pg-name"></span><span class="pbar"><i></i></span><span class="pg-n" dir="ltr"></span><span class="pg-sub"><span class="pg-nx"></span><span class="pg-ok"></span></span>';
      a.querySelector(".tcode").textContent = i + 1;
      a.querySelector(".pg-name").textContent = th.name[lang];
      a.querySelector(".pbar i").style.width = Math.round(st.pct * 100) + "%";
      a.querySelector(".pg-n").textContent = st.done + "/" + st.total;
      a.querySelector(".pg-nx").textContent = nx ? PT[0] + (i + 1) + "." + num + " " + (nx.t[lang] || nx.t.fr) : PT[2];
      var x = ts[th.slug], n = x ? x.r + x.w : 0, ok = a.querySelector(".pg-ok");
      if (n) { ok.innerHTML = '<span></span><span class="pbar pbar-ok"><i></i></span>'; ok.firstChild.textContent = PT[1] + Math.round(100 * x.r / n) + "% (" + n + ")"; ok.querySelector("i").style.width = Math.round(100 * x.r / n) + "%"; }
      else ok.textContent = PT[3];
      a.addEventListener("click", function () { Measure.add("pg_th"); });
      box.appendChild(a);
    });
    var hist = $("#pgHist"); hist.innerHTML = "";
    if (!h.length) { var pe = document.createElement("p"); pe.className = "muted"; pe.textContent = u("histEmpty"); hist.appendChild(pe); }
    else {
      var tbl = document.createElement("div"); tbl.className = "tbl-wrap";
      tbl.innerHTML = '<table class="tbl"><thead><tr><th scope="col"></th><th scope="col"></th><th scope="col"></th><th scope="col"></th></tr></thead><tbody></tbody></table>';
      var ths = $$("th", tbl); [u("h_date"), u("h_type"), u("h_theme"), u("h_score")].forEach(function (x, i) { ths[i].textContent = x; });
      var tb = $("tbody", tbl);
      h.slice().reverse().slice(0, premium ? 500 : 3).forEach(function (x) {
        var d = new Date(x.ts), tr = document.createElement("tr"), r = x.score / x.total;
        tr.innerHTML = '<td dir="ltr"></td><td></td><td></td><td dir="ltr"><b></b> <span class="sc"></span></td>';
        var c = tr.children;
        c[0].textContent = fmtDate(x.ts) + " " + ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
        c[1].textContent = x.kind === "exam" ? u("t_exam") : x.kind === "livre" ? u("t_livre") : u("t_train");
        c[2].textContent = /^livre-/.test(x.theme) ? (u("t_livre") + " " + x.theme.slice(6)) : themeName(x.theme);
        $("b", c[3]).textContent = x.score + "/" + x.total;
        var sc = $(".sc", c[3]); sc.textContent = Math.round(r * 100) + "%"; sc.dataset.level = r >= 0.85 ? "ok" : r >= 0.5 ? "mid" : "low";
        tb.appendChild(tr);
      });
      hist.appendChild(tbl);
      if (!premium && h.length > 3) { var hf = document.createElement("p"); hf.className = "muted hist-free"; hf.innerHTML = '<span></span> <a href="activer.html"></a>';
        hf.firstChild.textContent = u("histFree"); hf.lastChild.textContent = t("unlock"); hist.appendChild(hf); }
    }
    var eb = $("#pgErrBtn"); if (eb) eb.hidden = !errs;
    drawStreak($("#streak2"));
    var rs = $("#pgReset"); if (rs && !rs.dataset.armed) rs.textContent = u("reset");
  }
  if (pgRing) {
    var rs = $("#pgReset");
    if (rs) rs.addEventListener("click", function () {
      if (rs.dataset.armed) { Track.reset(); delete rs.dataset.armed; drawStats(); return; }
      rs.dataset.armed = "1"; rs.textContent = u("resetSure");
      setTimeout(function () { if (rs.dataset.armed) { delete rs.dataset.armed; rs.textContent = u("reset"); } }, 4000);
    });
    drawStats(); listeners.push(drawStats);
    /* backup / restore (cahier v2 § 7): a copyable code, works in the app and in any browser */
    var bk = $("#pgBackup");
    if (bk) {
      var code = $("#pgCode"), bmsg = $("#pgBkMsg"), imp = $("#pgImport"), file = $("#pgFile");
      var say = function (k) { bmsg.hidden = false; bmsg.dataset.k = k; bmsg.textContent = u(k); };
      listeners.push(function () { if (!bmsg.hidden && bmsg.dataset.k) bmsg.textContent = u(bmsg.dataset.k); });
      var enc = function () { var j = JSON.stringify(Track.dump()); return "RK1." + btoa(unescape(encodeURIComponent(j))); };
      $("#pgExport").addEventListener("click", function () {
        code.value = enc(); code.select();
        try { navigator.clipboard.writeText(code.value).catch(function () {}); } catch (e) {}
        try { document.execCommand("copy"); } catch (e) {}
        say("bkCopied");
      });
      if (file) file.addEventListener("click", function () { file.href = "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(Track.dump())); });
      imp.addEventListener("click", function () {
        var raw = code.value.trim(), o = null;
        try { o = raw.charAt(0) === "{" ? JSON.parse(raw) : JSON.parse(decodeURIComponent(escape(atob(raw.replace(/^RK1\./, ""))))); } catch (e) { o = null; }
        if (!o || o.v !== 1) { delete imp.dataset.armed; say("bkBad"); return; }
        if (!imp.dataset.armed) { imp.dataset.armed = "1"; say("bkSure"); return; }
        delete imp.dataset.armed; Track.load(o); say("bkOk"); drawStats();
      });
    }
  }
  listeners.push(drawCards);

  /* ---------- book tests: reveal, self-mark, score ---------- */
  (function () {
    var LK = "rokhssati-livre";
    function all() { try { return JSON.parse(localStorage.getItem(LK) || "{}"); } catch (e) { return {}; } }
    function save(o) { try { localStorage.setItem(LK, JSON.stringify(o)); } catch (e) {} }
    var box = $("#lt");
    if (box) {
      var n = box.dataset.test, total = +box.dataset.total;
      if (box.dataset.locked === "1" && !pass()) { box.dataset.lockedOn = "1"; var lk = $(".lt-lock", box); if (lk) lk.hidden = false; }
      var items = $$(".lt-item", box);
      function paint() {
        var st = all()[n] || {}, ok = 0, done = 0;
        items.forEach(function (it) {
          var v = st[it.dataset.id];
          if (v === 1 || v === 0) { it.dataset.v = String(v); done++; if (v === 1) ok++; } else delete it.dataset.v;
        });
        var fin = done >= total, w = $(".lt-wait", box), f = $(".lt-final", box);
        $(".lt-done", box).textContent = done + "/" + total;
        if (w) w.hidden = fin;
        if (f) {
          f.hidden = !fin;
          $(".lt-score-n", f).textContent = ok + "/" + total;
          var v = $(".lt-verdict", f), good = ok / total >= 0.8;
          v.dataset.ok = good ? "1" : "0";
          v.textContent = t(good ? "ltPass" : "ltFail");
        }
        return { ok: ok, done: done };
      }
      items.forEach(function (it) {
        $$(".lt-mark button", it).forEach(function (b) {
          b.addEventListener("click", function () {
            var o = all(), st = o[n] || {};
            var before = Object.keys(st).length;
            st[it.dataset.id] = +b.dataset.v; o[n] = st; save(o);
            var r = paint();
            if (r.done === total && before < total) Track.test("livre", "livre-" + n, r.ok, total);
          });
        });
      });
      var rs = $(".lt-reset", box);
      if (rs) rs.addEventListener("click", function () { var o = all(); delete o[n]; save(o); items.forEach(function (it) { var d = $("details", it); if (d) d.open = false; }); paint(); });
      paint();
    }
    var cards = $$(".lt-card");
    if (cards.length) {
      var o = all(), p = pass();
      cards.forEach(function (c) {
        var st = o[c.dataset.test] || {}, ks = Object.keys(st), ok = ks.filter(function (k) { return st[k] === 1; }).length;
        var s = $(".lt-card-s", c); if (s && ks.length) s.textContent = ok + "/" + ks.length;
        if (ks.length >= 30) c.dataset.done = "1";
        var l = $(".lt-card-lock", c); if (l && p) l.hidden = true;
      });
    }
  })();

  /* ---------- Mes messages (contact page) + "new reply" bar on every page ---------- */
  (function () {
    var box = inboxBox(false), list = $("#inboxList"), wrap = $("#inbox");
    var SEEN = "rokhssati-box-seen", LAST = "rokhssati-box-check";
    function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    var items = null;
    function draw() {
      if (!list) return;
      wrap.hidden = !box && !items;
      list.innerHTML = "";
      if (items === "net") { var pe = document.createElement("p"); pe.className = "muted"; pe.textContent = t("inNet"); list.appendChild(pe); return; }
      if (!items || !items.length) { var p0 = document.createElement("p"); p0.className = "muted"; p0.textContent = t("inEmpty"); list.appendChild(p0); return; }
      items.forEach(function (it) {
        var d = document.createElement("div"); d.className = "in-msg " + (it.from === "r" ? "is-r" : "is-me");
        d.innerHTML = "<b></b> <small dir=\"ltr\"></small><p></p>";
        d.querySelector("b").textContent = it.from === "r" ? t("inR") : t("inMe");
        d.querySelector("small").textContent = fmtDate(new Date(it.at).getTime());
        d.querySelector("p").textContent = it.text;
        // RKV3-28 (13/11/2026): optional "did this help?" under our latest reply, anonymous counters rep_up / rep_dn, asked once per reply
        if (it.from === "r" && it === items.filter(function (x) { return x.from === "r"; }).pop()) {
          var FK = "rokhssati-fb-" + it.at, FB = { ar: ["هل ساعدك هذا الرد؟", "نعم", "لا", "شكرًا على رأيك!"], fr: ["Cette réponse vous a aidé ?", "Oui", "Non", "Merci pour votre avis !"], dz: ["هاد الرد عاونك؟", "إيه", "لا", "يعطيك الصحة على رأيك!"] }[lang] || [];
          var fb = document.createElement("p"); fb.className = "in-fb muted";
          if (lsGet(FK)) fb.textContent = FB[3];
          else {
            fb.innerHTML = '<span></span> <button type="button" class="btn btn-ghost in-up">👍 <b></b></button> <button type="button" class="btn btn-ghost in-dn">👎 <b></b></button>';
            fb.firstChild.textContent = FB[0]; fb.querySelector(".in-up b").textContent = FB[1]; fb.querySelector(".in-dn b").textContent = FB[2];
            $$("button", fb).forEach(function (bt) { bt.addEventListener("click", function () { Measure.add(bt.classList.contains("in-up") ? "rep_up" : "rep_dn"); lsSet(FK, "1"); fb.textContent = FB[3]; }); });
          }
          d.appendChild(fb);
        }
        list.appendChild(d);
      });
    }
    function bar(show) {
      var b = $("#inboxBar");
      if (!show) { if (b) b.hidden = true; return; }
      if (!b) {
        b = document.createElement("div"); b.id = "inboxBar"; b.className = "inbox-bar"; b.setAttribute("role", "status");
        b.innerHTML = '<span></span> <a href="contact.html#messages"></a>';
        var app = document.getElementById("app"); app.insertBefore(b, app.firstChild);
      }
      b.hidden = false; b.firstChild.textContent = t("inNew"); b.lastChild.textContent = t("inSee");
    }
    // 13/11/2026: read receipt → Gestion shows « lu le … ». Sent once per new reply; the reply date only, nothing else.
    function ack(at) {
      if (lsGet("rokhssati-box-acked") === at) return;
      fetch(API_BASE + "/api/inbox", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ box: box, seen: at }) })
        .then(function (r) { if (r.ok) lsSet("rokhssati-box-acked", at); }).catch(function () {});
    }
    function check(force) {
      box = inboxBox(false);
      if (!box) { draw(); return; }
      var now = Date.now(), last = +(lsGet(LAST) || 0);
      if (!list && !force && now - last < 30 * 60000) { if (lsGet("rokhssati-box-unread") === "1") bar(true); return; }
      lsSet(LAST, String(now));
      fetch(API_BASE + "/api/inbox?box=" + encodeURIComponent(box), { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
        if (!j.ok) return;
        items = j.items || [];
        var lastR = items.filter(function (x) { return x.from === "r"; }).map(function (x) { return x.at; }).sort().pop() || "";
        if (list) { if (lastR) { lsSet(SEEN, lastR); ack(lastR); if (window.RokhNative && typeof window.RokhNative.seen === "function") { try { window.RokhNative.seen(lastR); } catch (e) {} } } lsSet("rokhssati-box-unread", "0"); bar(false); }
        else { var unread = lastR && lastR > (lsGet(SEEN) || ""); lsSet("rokhssati-box-unread", unread ? "1" : "0"); bar(unread); }
        draw();
      }).catch(function () { if (list) { items = "net"; draw(); } });
    }
    window.rkInbox = check;
    listeners.push(function () { draw(); var b = $("#inboxBar"); if (b && !b.hidden) bar(true); });
    if (list) draw();
    check(false);
  })();

  /* manœuvres (13/11/2026): Premium parts (.prem-zone) shown only with an active access (trial / code); test version: preview button */
  (function () {
    if (!document.querySelector(".prem-zone")) return;
    if (pass()) document.documentElement.classList.add("has-pass");
    document.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".prem-peek")) document.documentElement.classList.add("has-pass"); });
  })();

  /* (13/11/2026, owner) figures no longer open full screen: zoom removed everywhere. Signs keep their own fiche. */

  /* Premium "prévenez-moi" list: e-mail only (functions/api/contact.js kind "premium"); nothing to pay, no pre-order */
  (function () {
    var f = $("#waitForm"); if (!f) return;
    var M = { ar: ["سنخبرك عند صدور البريميوم. شكرًا!", "اكتب بريدًا إلكترونيًا صحيحًا.", "تعذّر الإرسال. تحقق من الاتصال بالإنترنت."],
              fr: ["C'est noté : nous vous préviendrons à la sortie du Premium. Merci !", "Écrivez une adresse e-mail valide.", "Envoi impossible. Vérifiez votre connexion internet."],
              dz: ["مليح: نخبروك كي يخرج البريميوم. يعطيك الصحة!", "اكتب إيمايل صحيح.", "ما تبعثش. شوف الأنترنت."] };
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var m = M[lang] || M.fr, out = $("#waitMsg"), mail = $("#waitMail").value.trim();
      out.hidden = false;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) { out.dataset.state = "ko"; out.textContent = m[1]; return; }
      fetch((window.RokhNative ? "https://rokhssati.com" : "") + "/api/contact", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "premium", email: mail, lang: lang, hp: $("#waitHp").value }) })
        .then(function (r) { return r.json(); }).then(function (j) { out.dataset.state = j && j.ok ? "ok" : "ko"; out.textContent = j && j.ok ? m[0] : m[1]; if (j && j.ok) f.reset(); })
        .catch(function () { out.dataset.state = "ko"; out.textContent = m[2]; });
    });
  })();

  /* Confidentialité: opt out / back in of the anonymous measurement (same switch as the owner's, "rokhssati-notrack") */
  (function () {
    var b = $("#mOpt"), st = $("#mOptState"); if (!b) return;
    var M = { ar: ["أنت تشارك في القياس المجهول.", "أنت لا تشارك في القياس (على هذا المتصفح).", "عدم المشاركة", "المشاركة من جديد"],
              fr: ["Vous participez à la mesure anonyme.", "Vous ne participez pas à la mesure (sur ce navigateur).", "Ne pas participer", "Participer de nouveau"],
              dz: ["راك تشارك في القياس المجهول.", "ما راكش تشارك في القياس (في هاد المتصفح).", "ما نحبش نشارك", "نشارك عاوتاني"] };
    function draw() { var off = false; try { off = localStorage.getItem("rokhssati-notrack") === "1"; } catch (e) {} var m = M[lang] || M.fr; st.textContent = off ? m[1] : m[0]; b.textContent = off ? m[3] : m[2]; }
    b.addEventListener("click", function () { try { if (localStorage.getItem("rokhssati-notrack") === "1") localStorage.removeItem("rokhssati-notrack"); else { localStorage.setItem("rokhssati-notrack", "1"); localStorage.removeItem("rokhssati-evq"); } } catch (e) {} try { if (window.RokhNative && window.RokhNative.setNoTrack) window.RokhNative.setNoTrack(localStorage.getItem("rokhssati-notrack") === "1"); } catch (e) {} draw(); });
    listeners.push(draw); draw();
  })();

  /* APK download: owner's browsers not counted (&me=1) + install guide shown right after the tap */
  (function () {
    if (window.RokhNative) return;
    var G = {
      ar: { t: "ثبّت التطبيق في 3 خطوات", s: ["عند التحميل، إذا ظهر «قد يكون الملف ضارًا»: اضغط «تحميل على أي حال». الملف آمن (البصمة SHA-256 في الصفحة).", "افتح الملف rokhssati.apk من الإشعارات أو من «التنزيلات». إذا طلب أندرويد: «الإعدادات» ← «السماح من هذا المصدر».", "اضغط «تثبيت». إذا ظهر Play Protect: «التفاصيل» ← «التثبيت على أي حال». ثم افتح التطبيق مع الإنترنت مرة واحدة."], pc: "ملف APK لا يُثبَّت على الحاسوب: افتح rokhssati.com على هاتف أندرويد وحمّل التطبيق منه.", ok: "فهمت" },
      fr: { t: "Installer l'appli en 3 étapes", s: ["Si Chrome affiche « Ce fichier peut être dangereux » : touchez « Télécharger quand même ». Le fichier est sûr (empreinte SHA-256 sur la page).", "Ouvrez rokhssati.apk depuis la notification ou « Téléchargements ». Si Android le demande : « Paramètres » → « Autoriser cette source ».", "Touchez « Installer ». Si Play Protect s'affiche : « Plus de détails » → « Installer quand même ». Puis ouvrez l'appli une fois avec Internet."], pc: "Un fichier APK ne s'installe pas sur un ordinateur : ouvrez rokhssati.com sur votre téléphone Android et téléchargez l'appli depuis celui-ci.", ok: "Compris" },
      dz: { t: "ثبّت التطبيق في 3 خطوات", s: ["إلا Chrome قالك «الفيشي يقدر يكون خطير»: اضغط «تحميل على كل حال». الفيشي آمن (البصمة SHA-256 في الصفحة).", "حل rokhssati.apk من النوتيفيكاسيون ولا من «التنزيلات». إلا أندرويد طلب: «الإعدادات» ← «اسمح من هاد المصدر».", "اضغط «تثبيت». إلا خرج Play Protect: «التفاصيل» ← «ثبّت على كل حال». ومن بعد حل التطبيق مرة بالأنترنت."], pc: "الـ APK ما يتثبتش في البيسي: حل rokhssati.com في تيليفون أندرويد وحمّل منو.", ok: "فهمت" }
    };
    var ov = null;
    function guide() {
      var g = G[lang] || G.fr, android = /android/i.test(navigator.userAgent);
      if (!ov) { ov = document.createElement("div"); ov.className = "sg-ov dl-guide"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); document.getElementById("app").appendChild(ov);
        ov.addEventListener("click", function (e) { if (e.target === ov || e.target.closest(".dg-ok")) { ov.hidden = true; document.documentElement.classList.remove("news-open"); } }); }
      ov.setAttribute("dir", lang === "fr" ? "ltr" : "rtl");
      ov.innerHTML = '<div class="sg-box"><h3></h3>' + (android ? '<ol class="dg-steps"></ol>' : '<p class="dg-pc"></p>') + '<button type="button" class="btn btn-primary dg-ok"></button></div>';
      $("h3", ov).textContent = android ? g.t : "💻 → 📱";
      if (android) g.s.forEach(function (x, i) { var li = document.createElement("li"); li.innerHTML = '<span class="dg-n">' + (i + 1) + '</span><span></span>'; li.lastChild.textContent = x; $(".dg-steps", ov).appendChild(li); });
      else $(".dg-pc", ov).textContent = g.pc;
      $(".dg-ok", ov).textContent = g.ok;
      ov.hidden = false; document.documentElement.classList.add("news-open"); $(".dg-ok", ov).focus();
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest('a[href*="api/dl"]'); if (!a) return;
      var me = false; try { me = localStorage.getItem("rokhssati-notrack") === "1"; } catch (x) {}
      if (me && a.href.indexOf("me=1") < 0) a.href += (a.href.indexOf("?") < 0 ? "?" : "&") + "me=1";
      if (a.href.indexOf("to=apkpure") >= 0) return;   // APKPure page: its own install flow, no guide
      setTimeout(guide, 300);
    }, true);
  })();

  /* app (1.4.24+): offer the 3-day trial once, at the first opening, if places are left and no pass yet */
  (function () {
    if (!window.RokhNative || /activer\.html/.test(location.pathname)) return;
    var K = "rokhssati-trialpop"; try { if (localStorage.getItem(K)) return; } catch (e) { return; }
    if (pass()) return;
    fetch("https://rokhssati.com/api/essai?info=1", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      if (!j || !(j.left > 0) || pass()) return;
      try { localStorage.setItem(K, "1"); } catch (e) {}
      var M = { ar: ["🎁 أيامك الثلاثة من بريميوم تنتظرك", "مجانًا لأول 20 تثبيتًا جديدًا، بقي %n أماكن. بدون رمز وبدون دفع: امتحانات تجريبية، إحصائيات وسجل كامل.", "فعّل أيامي الثلاثة", "لاحقًا"],
                fr: ["🎁 Tes 3 jours de Premium t'attendent", "Offerts aux 20 prochaines installations, plus que %n places. Sans code, sans paiement : examens blancs, statistiques et historique complet.", "Activer mes 3 jours", "Plus tard"],
                dz: ["🎁 الثلاث أيام بريميوم تاعك راهم يستناو", "بلاش للعشرين الأوائل، بقاو %n بلايص. بلا كود وبلا دراهم: امتحانات تجريبية، إحصائيات والسجل كامل.", "فعّل الثلاث أيام تاعي", "من بعد"] };
      var m = M[lang] || M.fr, ov = document.createElement("div");
      ov.className = "sg-ov trial-pop"; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("dir", lang === "fr" ? "ltr" : "rtl");
      ov.innerHTML = '<div class="sg-box"><h3></h3><p></p><a class="btn btn-primary btn-xl" href="activer.html?essai=1#trialBox"></a><button type="button" class="btn btn-ghost tp-later"></button></div>';
      $("h3", ov).textContent = m[0]; $("p", ov).textContent = m[1].replace("%n", j.left); $("a", ov).textContent = m[2]; $(".tp-later", ov).textContent = m[3];
      ov.addEventListener("click", function (e) { if (e.target === ov || e.target.classList.contains("tp-later")) { ov.remove(); document.documentElement.classList.remove("news-open"); } });
      (function show() {   // wait until the "what's new" window is closed: one window at a time
        if (document.documentElement.classList.contains("news-open")) return setTimeout(show, 800);
        document.getElementById("app").appendChild(ov); document.documentElement.classList.add("news-open");
      })();
    }).catch(function () {});
  })();

  /* R4-015 / US-P08 (13/11/2026): a returning learner sees "Reprendre : <chapitre>" on the home page (last chapter opened, or the next one if it is done) */
  (function () {
    var a = $("#heroResume"); if (!a) return;
    function draw() {
      var p = Track.prog(), L = p.last, ci = null; if (!L || !L.chap) { a.hidden = true; return; }
      try { ci = JSON.parse(document.getElementById("courseIndex").textContent); } catch (e) {}
      var list = []; (ci || []).forEach(function (th) { th.chapters.forEach(function (c) { list.push({ th: th.slug, c: c }); }); });
      var i = -1; list.some(function (x, k) { if (x.c.id === L.chap) { i = k; return true; } return false; });
      if (i < 0) { a.hidden = true; return; }
      if (p.done[L.chap]) { var j = i + 1; while (j < list.length && p.done[list[j].c.id]) j++; if (j >= list.length) { a.hidden = true; return; } i = j; }
      var x = list[i], R = { ar: "تابع: ", fr: "Reprendre : ", dz: "كمّل: " };
      a.setAttribute("href", "theme-" + x.th + ".html#c=" + x.c.id);
      a.querySelector("span").textContent = (R[lang] || R.fr) + (x.c.t[lang] || x.c.t.fr);
      a.hidden = false;
    }
    draw(); listeners.push(draw);
  })();

  /* home: launch offer, live count of remaining trial places (functions/api/essai.js?info=1) */
  (function () {
    // R4-007 (13/11/2026): every mention of the "10 places" gift disappears when no place is left (.trial-ad = a line of the "Nouveauté" pop-up)
    var h = $("#offerHero"), c = $(".apk-offer-card"), ads = $$(".trial-ad"); if (!h && !c && !ads.length) return;
    fetch((window.RokhNative ? "https://rokhssati.com" : "") + "/api/essai?info=1", { cache: "no-store" }).then(function (r) { return r.json(); }).then(function (j) {
      var n = +j.left; if (isNaN(n)) return;
      if (n <= 0) { if (h) h.hidden = true; if (c) c.hidden = true; ads.forEach(function (a) { var li = a.closest("li") || a; li.hidden = true; }); return; }
      var html = '<span class="l-ar">بقيت ' + n + ' أماكن فقط</span><span class="l-fr" lang="fr">Plus que ' + n + ' place' + (n > 1 ? "s" : "") + '</span><span class="l-dz" lang="ar-DZ">بقاو غير ' + n + ' بلايص</span>';
      $$("#offerLeft, #offerLeft2").forEach(function (e) { e.innerHTML = html; e.hidden = false; });
    }).catch(function () {});
  })();

  /* fiche of a sign (signification, réaction, situation, confusion) — build/signs_info.py
     panneaux.html: every .sg figure; course pages: every .s-sign[data-k] outside quiz slides (#sgData holds the cards) */
  (function () {
    var onGuide = !!$(".sg"), data = $("#sgData"); if (!onGuide && !data) return;
    function card(k) { return onGuide ? $("#p-" + k + " .sg-card") : data.querySelector('.sg-card[data-k="' + k + '"]'); }
    function pic(k) { var e = document.getElementById("p-" + k) || $('.s-sign[data-k="' + k + '"]'); return e && e.querySelector("svg"); }
    var ov = document.createElement("div"); ov.className = "sg-ov"; ov.hidden = true; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
    ov.innerHTML = '<div class="sg-box"><button type="button" class="sg-x" aria-label="×">×</button><div class="sg-big"></div><div class="sg-body"></div></div>';
    document.getElementById("app").appendChild(ov);
    var last = null;
    function close() { if (ov.hidden) return; ov.hidden = true; if (!$(".viewer:not([hidden])")) document.documentElement.classList.remove("news-open"); if (onGuide && location.hash.indexOf("#p-") === 0) history.replaceState(null, "", location.pathname + location.search); if (last && last.focus) last.focus(); }
    function open(k) {
      var src = card(k), sv = pic(k); if (!src || !sv) return;
      if (ov.hidden) last = document.activeElement;
      $(".sg-big", ov).innerHTML = ""; $(".sg-big", ov).appendChild(sv.cloneNode(true));
      var c = src.cloneNode(true); c.hidden = false;
      $$(".sg-mini", c).forEach(function (m) { var o = pic(m.getAttribute("data-k")); if (o) m.appendChild(o.cloneNode(true)); else m.remove(); });
      $(".sg-body", ov).innerHTML = ""; $(".sg-body", ov).appendChild(c);
      ov.setAttribute("aria-label", (c.querySelector("h3") || {}).textContent || "");
      ov.hidden = false; document.documentElement.classList.add("news-open"); $(".sg-x", ov).focus();
      if (onGuide && history.replaceState) history.replaceState(null, "", "#p-" + k);
    }
    ov.addEventListener("click", function (e) {
      if (e.target === ov || e.target.classList.contains("sg-x")) return close();
      var m = e.target.closest && e.target.closest(".sg-mini"); if (m) { e.preventDefault(); open(m.getAttribute("data-k")); }
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !ov.hidden) { e.stopImmediatePropagation(); close(); } }, true);
    function target(e) { var f = e.target.closest && e.target.closest(".sg, .s-sign[data-k]"); return f && !f.closest(".slide-q") && !f.closest(".sg-ov") && card(f.getAttribute("data-k")) ? f : null; }
    document.addEventListener("click", function (e) { var f = target(e); if (f) open(f.getAttribute("data-k")); });
    document.addEventListener("keydown", function (e) { if (e.key !== "Enter" && e.key !== " ") return; var f = target(e); if (f) { e.preventDefault(); open(f.getAttribute("data-k")); } });
    function prep() { $$(".s-sign[data-k]").forEach(function (f) { if (f.dataset.sg || f.closest(".slide-q")) return; f.dataset.sg = "1"; f.classList.add("is-sg"); f.tabIndex = 0; f.setAttribute("role", "button"); }); }
    if (data) { prep(); new MutationObserver(prep).observe(document.getElementById("app"), { childList: true, subtree: true }); }
    var h = location.hash.slice(1); if (onGuide && h.indexOf("p-") === 0) open(h.slice(2));
  })();

  /* app: report installs and updates once per version (functions/api/maj.js) — no personal data */
  (function () {
    if (typeof ROKH_APP_CODE !== "number" || !window.RokhNative) return;
    var prev = null, old = false;
    try { prev = localStorage.getItem("rokhssati-appver"); old = !prev && !!(localStorage.getItem("rokhssati-lang") || localStorage.getItem("rokhssati-progress") || localStorage.getItem("rokhssati-history")); } catch (e) {}
    if (prev === String(ROKH_APP_CODE)) return;
    var from = prev || (old ? "old" : "new");
    fetch("https://rokhssati.com/api/maj?from=" + encodeURIComponent(from) + "&to=" + ROKH_APP_CODE, { cache: "no-store" })
      .then(function (r) { if (r.ok) { try { localStorage.setItem("rokhssati-appver", String(ROKH_APP_CODE)); } catch (e) {} } }).catch(function () {});
  })();

  /* offline bar: visible only while the device has no connection */
  (function () {
    var bar = document.getElementById("offlineBar");
    if (!bar) return;
    function upd() { bar.hidden = navigator.onLine !== false; }
    window.addEventListener("online", upd); window.addEventListener("offline", upd); upd();
  })();

  /* ---------- course checklists (« La checklist avant de partir », 09/11/2026): ticks kept in this browser only ---------- */
  function initCheck(box) {
    if (box._ck) return; box._ck = true;
    var key = "rokhssati-" + box.getAttribute("data-key"), ins = $$("input", box), n = $(".s-check-n b", box);
    function load() { try { return JSON.parse(localStorage.getItem(key) || "[]") || []; } catch (e) { return []; } }
    function draw() { var c = 0; ins.forEach(function (i) { if (i.checked) c++; }); n.textContent = c; box.classList.toggle("is-done", c === ins.length); }
    var on = load(); ins.forEach(function (i) { i.checked = on.indexOf(+i.value) >= 0; i.addEventListener("change", function () {
      var v = ins.filter(function (x) { return x.checked; }).map(function (x) { return +x.value; });
      try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} draw(); }); });
    $(".s-check-reset", box).addEventListener("click", function () { ins.forEach(function (i) { i.checked = false; }); try { localStorage.removeItem(key); } catch (e) {} draw(); });
    draw();
  }
  $$(".s-check").forEach(initCheck);

  /* ---------- Trouver une auto-école (owner 08/11/2026) ----------
     Data: OpenStreetMap contributors (ODbL), refreshed monthly (tools/osm). The list loads when a wilaya is chosen;
     the map (Leaflet + OSM tiles) only after a tap on "Afficher la carte", so nothing third-party loads before that. */
  (function aeFinder() {
    var box = document.getElementById("aeFinder"); if (!box) return;
    var W = { ar: { pick: "اختر ولايتك لعرض مدارس السياقة.", none: "لا توجد مدرسة سياقة مسجّلة في هذه الولاية بعد.", n: "%n مدرسة سياقة", n1: "مدرسة سياقة واحدة", f: "%f من %n",
                    call: "اتصال", map: "على الخريطة", net: "تعذّر تحميل القائمة. تحقق من الإنترنت وأعد المحاولة.", load: "جارٍ التحميل…", q: "البلدية أو الاسم", mapBtn: "اعرض الخريطة", mapHide: "أخفِ الخريطة", mapNet: "تعذّر تحميل الخريطة.", noname: "مدرسة سياقة (الاسم غير مُدرج)", nofilter: "لا نتيجة لهذا البحث." },
             fr: { pick: "Choisissez votre wilaya pour voir les auto-écoles.", none: "Aucune auto-école répertoriée dans cette wilaya pour l'instant.", n: "%n auto-écoles", n1: "1 auto-école", f: "%f sur %n",
                    call: "Appeler", map: "Sur la carte", net: "Impossible de charger la liste. Vérifiez votre connexion et réessayez.", load: "Chargement…", q: "Commune ou nom", mapBtn: "Afficher la carte", mapHide: "Masquer la carte", mapNet: "Impossible de charger la carte.", noname: "Auto-école (nom non renseigné)", nofilter: "Aucun résultat pour cette recherche." },
             dz: { pick: "اختار الولاية تاعك باش تشوف الأوطو إيكول.", none: "مازال ما كاين حتى أوطو إيكول مسجّلة في هاد الولاية.", n: "%n أوطو إيكول", n1: "أوطو إيكول وحدة", f: "%f من %n",
                    call: "عيّط", map: "في الخريطة", net: "ما قدرناش نحمّلو الليستة. شوف الأنترنت وعاود.", load: "راه يحمّل…", q: "البلدية ولا الاسم", mapBtn: "ورّي الخريطة", mapHide: "خبّي الخريطة", mapNet: "ما قدرناش نحمّلو الخريطة.", noname: "أوطو إيكول (الاسم ماكانش)", nofilter: "ما كاين حتى نتيجة." } };
    var w = function (k) { return W[lang][k]; };
    var sel = $("#aefW", box), q = $("#aefQ", box), list = $("#aefList", box), cnt = $("#aefCount", box), mapBtn = $("#aefMapBtn", box), mapEl = $("#aefMap", box);
    var data = null, rows = [], map = null, layer = null, wanting = false;
    function esc(x) { return String(x == null ? "" : x).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function opts() { $$("option", sel).forEach(function (o) { var v = o.getAttribute("data-" + lang); if (v) o.textContent = v; }); q.placeholder = w("q"); }
    function nameOf(s) { return (lang === "fr" ? (s.nf || s.n || s.na) : (s.na || s.n || s.nf)) || w("noname"); }
    function load(cb) {
      if (data) return cb();
      cnt.textContent = w("load");
      fetch(box.getAttribute("data-src")).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (d) { data = d; cb(); })
        .catch(function () { cnt.textContent = w("net"); });
    }
    function phones(p) { return (p || []).map(function (x) { var tel = x.replace(/[^+\d]/g, ""); return '<a class="btn btn-ghost btn-sm" href="tel:' + esc(tel) + '" dir="ltr">' + esc(x) + "</a>"; }).join(""); }
    function render() {
      var code = +sel.value; if (!code) { list.innerHTML = ""; cnt.textContent = w("pick"); mapBtn.hidden = true; return; }
      var all = data.s.filter(function (s) { return s.wl === code; }), f = (q.value || "").trim().toLowerCase();
      rows = f ? all.filter(function (s) { return [s.n, s.na, s.nf, s.c, s.s].join(" ").toLowerCase().indexOf(f) >= 0; }) : all;
      var total = all.length === 1 ? w("n1") : w("n").replace("%n", fmt(all.length));
      cnt.textContent = !all.length ? w("none") : (f ? (rows.length ? w("f").replace("%f", fmt(rows.length)).replace("%n", total) : w("nofilter")) : total);
      list.innerHTML = rows.map(function (s, i) {
        var addr = [s.s, s.c].filter(Boolean).join(" · ");
        return '<li class="aef-item"><div class="aef-main"><h3>' + esc(nameOf(s)) + "</h3>" + (addr ? '<p class="aef-addr">' + esc(addr) + "</p>" : "") + "</div>" +
          '<div class="aef-act">' + phones(s.p) + '<button type="button" class="btn btn-ghost btn-sm" data-aef="' + i + '">' + esc(w("map")) + "</button></div></li>";
      }).join("");
      mapBtn.hidden = !all.length; mapBtn.textContent = mapEl.hidden ? w("mapBtn") : w("mapHide");
      if (map) draw();
    }
    function css(href) { var l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l); }
    function leaflet(cb) {
      if (window.L && window.L.map) return cb();
      css("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css");
      var sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      sc.onload = cb; sc.onerror = function () { cnt.textContent = w("mapNet"); mapEl.hidden = true; mapBtn.textContent = w("mapBtn"); }; document.head.appendChild(sc);
    }
    function draw(focus) {
      if (!layer) return; layer.clearLayers();
      var pts = rows.map(function (s, i) {
        var m = window.L.circleMarker([s.la, s.lo], { radius: 8, color: "#0A4F32", weight: 2, fillColor: "#0E6A43", fillOpacity: 0.9 });
        m.bindPopup("<b>" + esc(nameOf(s)) + "</b>" + (s.c ? "<br>" + esc(s.c) : "") + (s.p && s.p[0] ? '<br><a href="tel:' + esc(s.p[0].replace(/[^+\d]/g, "")) + '" dir="ltr">' + esc(s.p[0]) + "</a>" : ""));
        m.addTo(layer); m._i = i; return m;
      });
      if (focus != null && pts[focus]) { map.setView(pts[focus].getLatLng(), 15); pts[focus].openPopup(); }
      else if (pts.length) map.fitBounds(window.L.featureGroup(pts).getBounds().pad(0.15), { maxZoom: 14 });
    }
    function showMap(focus) {
      mapEl.hidden = false; mapBtn.textContent = w("mapHide");
      leaflet(function () {
        if (!map) {
          map = window.L.map(mapEl, { scrollWheelZoom: false });
          map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
          window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
          layer = window.L.layerGroup().addTo(map); Measure.add("ae_map");
        }
        map.invalidateSize(); draw(focus);
        if (focus != null) mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
    sel.addEventListener("change", function () {
      try { localStorage.setItem("rokhssati-wilaya", sel.value); } catch (e) {}
      if (sel.value) Measure.add("ae_w");
      load(render);
    });
    q.addEventListener("input", function () { if (data) render(); });
    mapBtn.addEventListener("click", function () { if (mapEl.hidden) showMap(); else { mapEl.hidden = true; mapBtn.textContent = w("mapBtn"); } });
    list.addEventListener("click", function (e) { var b = e.target.closest("[data-aef]"); if (b) showMap(+b.getAttribute("data-aef")); });
    opts(); cnt.textContent = w("pick");
    listeners.push(function () { opts(); if (data && sel.value) render(); else cnt.textContent = w("pick"); });
    var last = null; try { last = localStorage.getItem("rokhssati-wilaya"); } catch (e) {}
    if (last && sel.querySelector('option[value="' + last + '"]')) { sel.value = last; load(render); }
  })();

  var saved = null;
  try { saved = localStorage.getItem("rokhssati-lang"); } catch (e) {}
  applyLang(saved || "ar");
  // 13/11/2026 : clics sur les cartes des 3 épreuves de l'accueil (ep:code, ep:manoeuvres), sans identifiant
(function () { try { document.querySelectorAll("a[data-ep]").forEach(function (a) { a.addEventListener("click", function () { try { Measure.add("ep:" + a.getAttribute("data-ep")); } catch (e) {} }); }); } catch (e) {} })();
})();

