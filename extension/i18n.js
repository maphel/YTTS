// YTTS — UI strings. Pure like lib.js (no DOM, no chrome.*); publishes globalThis.YTTS_I18N.
//
// The card follows YouTube's interface language (<html lang> on youtube.com), the popup the
// browser UI language. Unknown languages fall back to English. Manifest strings
// (extDescription, actionTitle) are generated into _locales/ by `npm run locales`;
// scripts/check.mjs fails when they drift. Placeholders: {time}, {text}.
(function (root) {
  'use strict';

  const KEYS = [
    'title', 'copy', 'copied', 'copyError', 'copyAria', 'copiedAnnounce', 'copyFailed',
    'expand', 'collapse', 'loading', 'noTranscript', 'loadFailed', 'empty', 'seekTo',
    'tagline', 'settings', 'view', 'viewHint', 'viewLines', 'viewSentences', 'viewText',
    'expandedByDefault', 'expandedHint', 'copyTimestamps', 'copyTimestampsHint',
    'autoSave', 'saved', 'saveFailed', 'settingsLoadFailed', 'extDescription', 'actionTitle',
  ];

  // Each row lists the values in KEYS order.
  const ROWS = {
    en: [
      'Transcript', 'Copy', 'Copied', 'Copy failed', 'Copy transcript', 'Transcript copied.', 'Copy failed. Please try again.',
      'Expand transcript', 'Collapse transcript', 'Loading transcript…', 'This video has no transcript.', 'The transcript could not be loaded.', 'The transcript is empty.', 'Jump to {time}: {text}',
      'Copy YouTube transcripts', 'Settings', 'View', 'Lines like YouTube, full sentences or running text', 'Lines', 'Sentences', 'Text',
      'Show transcript expanded', 'As soon as a video opens', 'Timestamps when copying', 'Include times in the copied text',
      'Settings are saved automatically.', 'Settings saved.', 'Saving failed. Please try again.', 'Settings could not be loaded.',
      'Read YouTube transcripts next to the video and copy them with one click.', 'YTTS – Copy transcript',
    ],
    de: [
      'Transkript', 'Kopieren', 'Kopiert', 'Kopierfehler', 'Transkript kopieren', 'Transkript kopiert.', 'Kopieren fehlgeschlagen. Bitte erneut versuchen.',
      'Transkript ausklappen', 'Transkript einklappen', 'Transkript wird geladen…', 'Für dieses Video gibt es kein Transkript.', 'Transkript konnte nicht geladen werden.', 'Transkript ist leer.', 'Zu {time} springen: {text}',
      'YouTube-Transkripte kopieren', 'Einstellungen', 'Ansicht', 'Zeilen wie YouTube, ganze Sätze oder Fließtext', 'Zeilen', 'Sätze', 'Text',
      'Transkript ausgeklappt anzeigen', 'Direkt beim Öffnen eines Videos', 'Zeitstempel beim Kopieren', 'Zeitangaben im kopierten Text',
      'Einstellungen werden automatisch gespeichert.', 'Einstellungen gespeichert.', 'Speichern fehlgeschlagen. Bitte erneut versuchen.', 'Einstellungen konnten nicht geladen werden.',
      'YouTube-Transkripte direkt neben dem Video lesen und mit einem Klick kopieren.', 'YTTS – Transkript kopieren',
    ],
    es: [
      'Transcripción', 'Copiar', 'Copiado', 'Error al copiar', 'Copiar transcripción', 'Transcripción copiada.', 'No se pudo copiar. Inténtalo de nuevo.',
      'Mostrar transcripción', 'Ocultar transcripción', 'Cargando transcripción…', 'Este video no tiene transcripción.', 'No se pudo cargar la transcripción.', 'La transcripción está vacía.', 'Ir a {time}: {text}',
      'Copiar transcripciones de YouTube', 'Configuración', 'Vista', 'Líneas como en YouTube, oraciones completas o texto continuo', 'Líneas', 'Oraciones', 'Texto',
      'Mostrar la transcripción expandida', 'Al abrir un video', 'Marcas de tiempo al copiar', 'Incluir tiempos en el texto copiado',
      'La configuración se guarda automáticamente.', 'Configuración guardada.', 'No se pudo guardar. Inténtalo de nuevo.', 'No se pudo cargar la configuración.',
      'Lee las transcripciones de YouTube junto al video y cópialas con un clic.', 'YTTS – Copiar transcripción',
    ],
    fr: [
      'Transcription', 'Copier', 'Copié', 'Échec de la copie', 'Copier la transcription', 'Transcription copiée.', 'La copie a échoué. Veuillez réessayer.',
      'Afficher la transcription', 'Masquer la transcription', 'Chargement de la transcription…', 'Cette vidéo n’a pas de transcription.', 'Impossible de charger la transcription.', 'La transcription est vide.', 'Aller à {time} : {text}',
      'Copier les transcriptions YouTube', 'Paramètres', 'Affichage', 'Lignes comme sur YouTube, phrases complètes ou texte continu', 'Lignes', 'Phrases', 'Texte',
      'Afficher la transcription dépliée', 'Dès l’ouverture d’une vidéo', 'Horodatage lors de la copie', 'Inclure les temps dans le texte copié',
      'Les paramètres sont enregistrés automatiquement.', 'Paramètres enregistrés.', 'Échec de l’enregistrement. Veuillez réessayer.', 'Impossible de charger les paramètres.',
      'Lisez les transcriptions YouTube à côté de la vidéo et copiez-les en un clic.', 'YTTS – Copier la transcription',
    ],
    it: [
      'Trascrizione', 'Copia', 'Copiato', 'Errore di copia', 'Copia trascrizione', 'Trascrizione copiata.', 'Copia non riuscita. Riprova.',
      'Espandi trascrizione', 'Comprimi trascrizione', 'Caricamento trascrizione…', 'Questo video non ha una trascrizione.', 'Impossibile caricare la trascrizione.', 'La trascrizione è vuota.', 'Vai a {time}: {text}',
      'Copia le trascrizioni di YouTube', 'Impostazioni', 'Visualizzazione', 'Righe come su YouTube, frasi intere o testo continuo', 'Righe', 'Frasi', 'Testo',
      'Mostra la trascrizione espansa', 'All’apertura di un video', 'Timestamp nella copia', 'Includi i tempi nel testo copiato',
      'Le impostazioni vengono salvate automaticamente.', 'Impostazioni salvate.', 'Salvataggio non riuscito. Riprova.', 'Impossibile caricare le impostazioni.',
      'Leggi le trascrizioni di YouTube accanto al video e copiale con un clic.', 'YTTS – Copia trascrizione',
    ],
    pt: [
      'Transcrição', 'Copiar', 'Copiado', 'Erro ao copiar', 'Copiar transcrição', 'Transcrição copiada.', 'Não foi possível copiar. Tente novamente.',
      'Expandir transcrição', 'Recolher transcrição', 'Carregando transcrição…', 'Este vídeo não tem transcrição.', 'Não foi possível carregar a transcrição.', 'A transcrição está vazia.', 'Ir para {time}: {text}',
      'Copiar transcrições do YouTube', 'Configurações', 'Visualização', 'Linhas como no YouTube, frases completas ou texto corrido', 'Linhas', 'Frases', 'Texto',
      'Mostrar transcrição expandida', 'Ao abrir um vídeo', 'Marcações de tempo ao copiar', 'Incluir tempos no texto copiado',
      'As configurações são salvas automaticamente.', 'Configurações salvas.', 'Não foi possível salvar. Tente novamente.', 'Não foi possível carregar as configurações.',
      'Leia transcrições do YouTube ao lado do vídeo e copie com um clique.', 'YTTS – Copiar transcrição',
    ],
    nl: [
      'Transcript', 'Kopiëren', 'Gekopieerd', 'Kopiëren mislukt', 'Transcript kopiëren', 'Transcript gekopieerd.', 'Kopiëren mislukt. Probeer het opnieuw.',
      'Transcript uitvouwen', 'Transcript samenvouwen', 'Transcript laden…', 'Deze video heeft geen transcript.', 'Het transcript kan niet worden geladen.', 'Het transcript is leeg.', 'Naar {time} gaan: {text}',
      'YouTube-transcripten kopiëren', 'Instellingen', 'Weergave', 'Regels zoals YouTube, hele zinnen of doorlopende tekst', 'Regels', 'Zinnen', 'Tekst',
      'Transcript uitgevouwen tonen', 'Zodra een video opent', 'Tijdstempels bij kopiëren', 'Tijden opnemen in de gekopieerde tekst',
      'Instellingen worden automatisch opgeslagen.', 'Instellingen opgeslagen.', 'Opslaan mislukt. Probeer het opnieuw.', 'Instellingen konden niet worden geladen.',
      'Lees YouTube-transcripten naast de video en kopieer ze met één klik.', 'YTTS – Transcript kopiëren',
    ],
    pl: [
      'Transkrypcja', 'Kopiuj', 'Skopiowano', 'Błąd kopiowania', 'Kopiuj transkrypcję', 'Transkrypcja skopiowana.', 'Nie udało się skopiować. Spróbuj ponownie.',
      'Rozwiń transkrypcję', 'Zwiń transkrypcję', 'Wczytywanie transkrypcji…', 'Ten film nie ma transkrypcji.', 'Nie udało się wczytać transkrypcji.', 'Transkrypcja jest pusta.', 'Przejdź do {time}: {text}',
      'Kopiuj transkrypcje z YouTube', 'Ustawienia', 'Widok', 'Wiersze jak w YouTube, całe zdania lub tekst ciągły', 'Wiersze', 'Zdania', 'Tekst',
      'Pokazuj rozwiniętą transkrypcję', 'Od razu po otwarciu filmu', 'Sygnatury czasowe przy kopiowaniu', 'Dołącz czasy do kopiowanego tekstu',
      'Ustawienia są zapisywane automatycznie.', 'Zapisano ustawienia.', 'Nie udało się zapisać. Spróbuj ponownie.', 'Nie udało się wczytać ustawień.',
      'Czytaj transkrypcje YouTube obok filmu i kopiuj je jednym kliknięciem.', 'YTTS – Kopiuj transkrypcję',
    ],
    tr: [
      'Transkript', 'Kopyala', 'Kopyalandı', 'Kopyalama hatası', 'Transkripti kopyala', 'Transkript kopyalandı.', 'Kopyalanamadı. Lütfen tekrar deneyin.',
      'Transkripti genişlet', 'Transkripti daralt', 'Transkript yükleniyor…', 'Bu videonun transkripti yok.', 'Transkript yüklenemedi.', 'Transkript boş.', '{time} konumuna git: {text}',
      'YouTube transkriptlerini kopyalayın', 'Ayarlar', 'Görünüm', 'YouTube’daki gibi satırlar, tam cümleler veya akıcı metin', 'Satırlar', 'Cümleler', 'Metin',
      'Transkripti genişletilmiş göster', 'Bir video açılır açılmaz', 'Kopyalarken zaman damgaları', 'Kopyalanan metne zamanları ekle',
      'Ayarlar otomatik olarak kaydedilir.', 'Ayarlar kaydedildi.', 'Kaydedilemedi. Lütfen tekrar deneyin.', 'Ayarlar yüklenemedi.',
      'YouTube transkriptlerini videonun yanında okuyun ve tek tıkla kopyalayın.', 'YTTS – Transkripti kopyala',
    ],
    ru: [
      'Расшифровка', 'Копировать', 'Скопировано', 'Ошибка копирования', 'Копировать расшифровку', 'Расшифровка скопирована.', 'Не удалось скопировать. Повторите попытку.',
      'Развернуть расшифровку', 'Свернуть расшифровку', 'Загрузка расшифровки…', 'У этого видео нет расшифровки.', 'Не удалось загрузить расшифровку.', 'Расшифровка пуста.', 'Перейти к {time}: {text}',
      'Копирование расшифровок YouTube', 'Настройки', 'Вид', 'Строки как на YouTube, целые предложения или сплошной текст', 'Строки', 'Предложения', 'Текст',
      'Показывать расшифровку развёрнутой', 'Сразу при открытии видео', 'Метки времени при копировании', 'Добавлять время в скопированный текст',
      'Настройки сохраняются автоматически.', 'Настройки сохранены.', 'Не удалось сохранить. Повторите попытку.', 'Не удалось загрузить настройки.',
      'Читайте расшифровки YouTube рядом с видео и копируйте их одним щелчком.', 'YTTS – Копировать расшифровку',
    ],
    uk: [
      'Транскрипція', 'Копіювати', 'Скопійовано', 'Помилка копіювання', 'Копіювати транскрипцію', 'Транскрипцію скопійовано.', 'Не вдалося скопіювати. Спробуйте ще раз.',
      'Розгорнути транскрипцію', 'Згорнути транскрипцію', 'Завантаження транскрипції…', 'Це відео не має транскрипції.', 'Не вдалося завантажити транскрипцію.', 'Транскрипція порожня.', 'Перейти до {time}: {text}',
      'Копіювання транскрипцій YouTube', 'Налаштування', 'Вигляд', 'Рядки як на YouTube, цілі речення або суцільний текст', 'Рядки', 'Речення', 'Текст',
      'Показувати транскрипцію розгорнутою', 'Одразу після відкриття відео', 'Позначки часу під час копіювання', 'Додавати час до скопійованого тексту',
      'Налаштування зберігаються автоматично.', 'Налаштування збережено.', 'Не вдалося зберегти. Спробуйте ще раз.', 'Не вдалося завантажити налаштування.',
      'Читайте транскрипції YouTube поруч із відео й копіюйте їх одним клацанням.', 'YTTS – Копіювати транскрипцію',
    ],
    ja: [
      '文字起こし', 'コピー', 'コピーしました', 'コピーに失敗', '文字起こしをコピー', '文字起こしをコピーしました。', 'コピーできませんでした。もう一度お試しください。',
      '文字起こしを開く', '文字起こしを閉じる', '文字起こしを読み込んでいます…', 'この動画には文字起こしがありません。', '文字起こしを読み込めませんでした。', '文字起こしが空です。', '{time} に移動: {text}',
      'YouTube の文字起こしをコピー', '設定', '表示', 'YouTube と同じ行、文単位、または連続したテキスト', '行', '文', 'テキスト',
      '文字起こしを展開して表示', '動画を開いたらすぐに', 'コピー時にタイムスタンプを含める', 'コピーしたテキストに時間を含めます',
      '設定は自動的に保存されます。', '設定を保存しました。', '保存できませんでした。もう一度お試しください。', '設定を読み込めませんでした。',
      'YouTube の文字起こしを動画の横で読み、ワンクリックでコピーできます。', 'YTTS – 文字起こしをコピー',
    ],
    ko: [
      '스크립트', '복사', '복사됨', '복사 실패', '스크립트 복사', '스크립트가 복사되었습니다.', '복사하지 못했습니다. 다시 시도하세요.',
      '스크립트 펼치기', '스크립트 접기', '스크립트 불러오는 중…', '이 동영상에는 스크립트가 없습니다.', '스크립트를 불러올 수 없습니다.', '스크립트가 비어 있습니다.', '{time}(으)로 이동: {text}',
      'YouTube 스크립트 복사', '설정', '보기', 'YouTube와 같은 줄, 완전한 문장 또는 이어지는 텍스트', '줄', '문장', '텍스트',
      '스크립트를 펼친 상태로 표시', '동영상을 열면 바로', '복사할 때 타임스탬프 포함', '복사한 텍스트에 시간 포함',
      '설정이 자동으로 저장됩니다.', '설정이 저장되었습니다.', '저장하지 못했습니다. 다시 시도하세요.', '설정을 불러올 수 없습니다.',
      '동영상 옆에서 YouTube 스크립트를 읽고 클릭 한 번으로 복사하세요.', 'YTTS – 스크립트 복사',
    ],
    'zh-CN': [
      '转写文稿', '复制', '已复制', '复制失败', '复制转写文稿', '已复制转写文稿。', '复制失败，请重试。',
      '展开转写文稿', '收起转写文稿', '正在加载转写文稿…', '此视频没有转写文稿。', '无法加载转写文稿。', '转写文稿为空。', '跳转到 {time}：{text}',
      '复制 YouTube 转写文稿', '设置', '视图', '与 YouTube 相同的行、完整句子或连续文本', '行', '句子', '文本',
      '默认展开转写文稿', '打开视频时立即展开', '复制时包含时间戳', '在复制的文本中包含时间',
      '设置会自动保存。', '设置已保存。', '保存失败，请重试。', '无法加载设置。',
      '在视频旁阅读 YouTube 转写文稿，一键复制。', 'YTTS – 复制转写文稿',
    ],
    'zh-TW': [
      '轉錄稿', '複製', '已複製', '複製失敗', '複製轉錄稿', '已複製轉錄稿。', '複製失敗，請再試一次。',
      '展開轉錄稿', '收合轉錄稿', '正在載入轉錄稿…', '這部影片沒有轉錄稿。', '無法載入轉錄稿。', '轉錄稿是空的。', '跳至 {time}：{text}',
      '複製 YouTube 轉錄稿', '設定', '檢視', '與 YouTube 相同的行、完整句子或連續文字', '行', '句子', '文字',
      '預設展開轉錄稿', '開啟影片時立即展開', '複製時包含時間戳記', '在複製的文字中包含時間',
      '設定會自動儲存。', '已儲存設定。', '儲存失敗，請再試一次。', '無法載入設定。',
      '在影片旁閱讀 YouTube 轉錄稿，一鍵複製。', 'YTTS – 複製轉錄稿',
    ],
    hi: [
      'ट्रांसक्रिप्ट', 'कॉपी करें', 'कॉपी हो गया', 'कॉपी नहीं हुआ', 'ट्रांसक्रिप्ट कॉपी करें', 'ट्रांसक्रिप्ट कॉपी हो गया।', 'कॉपी नहीं हो सका। कृपया फिर से कोशिश करें।',
      'ट्रांसक्रिप्ट दिखाएं', 'ट्रांसक्रिप्ट छिपाएं', 'ट्रांसक्रिप्ट लोड हो रहा है…', 'इस वीडियो का कोई ट्रांसक्रिप्ट नहीं है।', 'ट्रांसक्रिप्ट लोड नहीं हो सका।', 'ट्रांसक्रिप्ट खाली है।', '{time} पर जाएं: {text}',
      'YouTube ट्रांसक्रिप्ट कॉपी करें', 'सेटिंग', 'व्यू', 'YouTube जैसी लाइनें, पूरे वाक्य या लगातार टेक्स्ट', 'लाइनें', 'वाक्य', 'टेक्स्ट',
      'ट्रांसक्रिप्ट खुला हुआ दिखाएं', 'वीडियो खुलते ही', 'कॉपी करते समय टाइमस्टैंप', 'कॉपी किए गए टेक्स्ट में समय शामिल करें',
      'सेटिंग अपने-आप सेव हो जाती हैं।', 'सेटिंग सेव हो गईं।', 'सेव नहीं हो सका। कृपया फिर से कोशिश करें।', 'सेटिंग लोड नहीं हो सकीं।',
      'वीडियो के बगल में YouTube ट्रांसक्रिप्ट पढ़ें और एक क्लिक में कॉपी करें।', 'YTTS – ट्रांसक्रिप्ट कॉपी करें',
    ],
    id: [
      'Transkrip', 'Salin', 'Disalin', 'Gagal menyalin', 'Salin transkrip', 'Transkrip disalin.', 'Gagal menyalin. Coba lagi.',
      'Luaskan transkrip', 'Ciutkan transkrip', 'Memuat transkrip…', 'Video ini tidak memiliki transkrip.', 'Transkrip tidak dapat dimuat.', 'Transkrip kosong.', 'Buka {time}: {text}',
      'Salin transkrip YouTube', 'Setelan', 'Tampilan', 'Baris seperti di YouTube, kalimat lengkap, atau teks bersambung', 'Baris', 'Kalimat', 'Teks',
      'Tampilkan transkrip diluaskan', 'Begitu video dibuka', 'Stempel waktu saat menyalin', 'Sertakan waktu dalam teks yang disalin',
      'Setelan disimpan secara otomatis.', 'Setelan disimpan.', 'Gagal menyimpan. Coba lagi.', 'Setelan tidak dapat dimuat.',
      'Baca transkrip YouTube di samping video dan salin dengan sekali klik.', 'YTTS – Salin transkrip',
    ],
    vi: [
      'Bản chép lời', 'Sao chép', 'Đã sao chép', 'Lỗi sao chép', 'Sao chép bản chép lời', 'Đã sao chép bản chép lời.', 'Không sao chép được. Vui lòng thử lại.',
      'Mở rộng bản chép lời', 'Thu gọn bản chép lời', 'Đang tải bản chép lời…', 'Video này không có bản chép lời.', 'Không tải được bản chép lời.', 'Bản chép lời trống.', 'Chuyển đến {time}: {text}',
      'Sao chép bản chép lời YouTube', 'Cài đặt', 'Chế độ xem', 'Dòng như trên YouTube, câu hoàn chỉnh hoặc văn bản liền mạch', 'Dòng', 'Câu', 'Văn bản',
      'Hiển thị bản chép lời ở dạng mở rộng', 'Ngay khi mở video', 'Dấu thời gian khi sao chép', 'Đưa thời gian vào văn bản đã sao chép',
      'Cài đặt được lưu tự động.', 'Đã lưu cài đặt.', 'Không lưu được. Vui lòng thử lại.', 'Không tải được cài đặt.',
      'Đọc bản chép lời YouTube ngay cạnh video và sao chép chỉ bằng một lần nhấp.', 'YTTS – Sao chép bản chép lời',
    ],
    ar: [
      'النص', 'نسخ', 'تم النسخ', 'تعذّر النسخ', 'نسخ النص', 'تم نسخ النص.', 'تعذّر النسخ. يُرجى المحاولة مرة أخرى.',
      'توسيع النص', 'تصغير النص', 'جارٍ تحميل النص…', 'لا يتوفّر نص لهذا الفيديو.', 'تعذّر تحميل النص.', 'النص فارغ.', 'الانتقال إلى {time}: {text}',
      'نسخ نصوص YouTube', 'الإعدادات', 'العرض', 'أسطر كما في YouTube أو جمل كاملة أو نص متصل', 'أسطر', 'جمل', 'نص',
      'عرض النص موسّعًا', 'فور فتح الفيديو', 'الطوابع الزمنية عند النسخ', 'تضمين الأوقات في النص المنسوخ',
      'يتم حفظ الإعدادات تلقائيًا.', 'تم حفظ الإعدادات.', 'تعذّر الحفظ. يُرجى المحاولة مرة أخرى.', 'تعذّر تحميل الإعدادات.',
      'اقرأ نصوص YouTube بجانب الفيديو وانسخها بنقرة واحدة.', 'YTTS – نسخ النص',
    ],
    sv: [
      'Transkription', 'Kopiera', 'Kopierat', 'Kopieringen misslyckades', 'Kopiera transkription', 'Transkriptionen har kopierats.', 'Det gick inte att kopiera. Försök igen.',
      'Visa transkription', 'Dölj transkription', 'Läser in transkription…', 'Den här videon har ingen transkription.', 'Det gick inte att läsa in transkriptionen.', 'Transkriptionen är tom.', 'Gå till {time}: {text}',
      'Kopiera transkriptioner från YouTube', 'Inställningar', 'Visning', 'Rader som på YouTube, hela meningar eller löpande text', 'Rader', 'Meningar', 'Text',
      'Visa transkriptionen expanderad', 'Så fort en video öppnas', 'Tidsstämplar vid kopiering', 'Ta med tider i den kopierade texten',
      'Inställningarna sparas automatiskt.', 'Inställningarna har sparats.', 'Det gick inte att spara. Försök igen.', 'Det gick inte att läsa in inställningarna.',
      'Läs YouTube-transkriptioner bredvid videon och kopiera dem med ett klick.', 'YTTS – Kopiera transkription',
    ],
  };

  const MESSAGES = Object.freeze(Object.fromEntries(Object.entries(ROWS).map(([lang, values]) => [
    lang, Object.freeze(Object.fromEntries(KEYS.map((key, i) => [key, values[i]]))),
  ])));
  const LOCALES = Object.freeze(Object.keys(MESSAGES));
  const RTL = new Set(['ar']);

  // BCP 47 tag (YouTube's <html lang> or the browser UI language) → a key of
  // MESSAGES. Chinese picks the script (Hant: TW/HK/MO), Portuguese any region, else English.
  function resolveLocale(tag) {
    const parts = String(tag || '').trim().replace(/_/g, '-').toLowerCase().split('-');
    const lang = parts[0];
    if (lang === 'zh') {
      return parts.some((p) => ['hant', 'tw', 'hk', 'mo'].includes(p)) ? 'zh-TW' : 'zh-CN';
    }
    return Object.hasOwn(MESSAGES, lang) ? lang : 'en';
  }

  function createTranslator(tag) {
    const locale = resolveLocale(tag);
    const table = MESSAGES[locale];
    const t = (key, vars = {}) => {
      const template = table[key] ?? MESSAGES.en[key] ?? key;
      return template.replace(/\{(\w+)\}/g, (match, name) => (Object.hasOwn(vars, name) ? String(vars[name]) : match));
    };
    return { locale, dir: RTL.has(locale) ? 'rtl' : 'ltr', t };
  }

  root.YTTS_I18N = Object.freeze({ KEYS: Object.freeze([...KEYS]), MESSAGES, LOCALES, resolveLocale, createTranslator });
})(globalThis);
