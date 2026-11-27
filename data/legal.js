// Privacy policy (#privacy) and terms of use (#terms) in the four interface languages.
// Plain, short and honest: what AstraTravel stores, for how long, and how to delete it.

export const legal = {
  privacy: {
    ru: {
      title: "Политика конфиденциальности",
      lead: "Какие данные хранит AstraTravel, зачем и как их удалить.",
      updated: "Обновлено 28 ноября 2026 года.",
      sections: [
        { heading: "Без входа", body: ["Без аккаунта избранное, «Мой маршрут», отметки «был(а) здесь» и настройки хранятся только в вашем браузере. Мы их не получаем.", "Если вы пишете Astra AI без регистрации, сервер учитывает число сообщений по зашифрованному (хешированному) адресу IP — сам адрес не сохраняется. Счётчик удаляется через три дня."] },
        { heading: "С аккаунтом", body: ["Мы храним: адрес почты; имя, язык, страну и район, если вы их указали; избранные места и рейсы; «Мой маршрут»; отметки «был(а) здесь»; ваши разговоры с Astra AI и число сообщений за день.", "Данные хранятся в базе Supabase (регион Европа) под защитой правил доступа: каждый пользователь видит только свои записи."] },
        { heading: "Astra AI", body: ["Текст сообщения и данные путеводителя отправляются в OpenAI, чтобы получить ответ. Мы просим OpenAI не сохранять запросы (store: false).", "Администраторы видят только количество и время сообщений. Текст разговора они видят, только если вы сами нажали «Показать поддержке»."] },
        { heading: "Сколько храним", body: ["Пока у вас есть аккаунт. Разговоры с Astra AI можно удалить в чате в любой момент."] },
        { heading: "Как удалить аккаунт", body: ["Откройте «Аккаунт» → «Удалить аккаунт» и подтвердите словом. Аккаунт и все связанные данные удаляются сразу и без возможности восстановления."] },
      ],
    },
    kk: {
      title: "Құпиялылық саясаты",
      lead: "AstraTravel қандай деректерді сақтайды, не үшін және оларды қалай жоюға болады.",
      updated: "2026 жылғы 28 қарашада жаңартылды.",
      sections: [
        { heading: "Кірмей пайдалану", body: ["Аккаунтсыз таңдаулылар, «Менің бағытым», «болдым» белгілері мен баптаулар тек браузеріңізде сақталады. Біз оларды алмаймыз.", "Тіркелмей Astra AI-ға жазсаңыз, сервер хабарлама санын IP мекенжайдың хешімен ғана есептейді — мекенжайдың өзі сақталмайды. Есептегіш үш күннен кейін жойылады."] },
        { heading: "Аккаунтпен", body: ["Біз сақтаймыз: электрондық пошта; көрсетсеңіз — атыңыз, тіліңіз, еліңіз бен ауданыңыз; таңдаулы орындар мен рейстер; «Менің бағытым»; «болдым» белгілері; Astra AI-мен әңгімелер және күндік хабарлама саны.", "Деректер Supabase дерекқорында (Еуропа өңірі) сақталады: әр пайдаланушы тек өз жазбаларын көреді."] },
        { heading: "Astra AI", body: ["Жауап алу үшін хабарлама мәтіні мен жолнұсқа деректері OpenAI-ға жіберіледі. Біз OpenAI-дан сұрауларды сақтамауды сұраймыз (store: false).", "Әкімшілер тек хабарламалардың саны мен уақытын көреді. Әңгіме мәтінін «Қолдауға көрсету» батырмасын өзіңіз басқанда ғана көреді."] },
        { heading: "Қанша уақыт сақтаймыз", body: ["Аккаунтыңыз бар уақытта. Astra AI-мен әңгімелерді чатта кез келген уақытта жоюға болады."] },
        { heading: "Аккаунтты қалай жоюға болады", body: ["«Аккаунт» → «Аккаунтты жою» бөлімін ашып, сөзбен растаңыз. Аккаунт пен оған қатысты барлық деректер бірден әрі қайтарымсыз жойылады."] },
      ],
    },
    en: {
      title: "Privacy policy",
      lead: "What AstraTravel stores, why, and how to delete it.",
      updated: "Updated 28 November 2026.",
      sections: [
        { heading: "Without an account", body: ["Without an account, favourites, “My route”, places you have been to and your settings stay in your browser only. We never receive them.", "If you message Astra AI without signing up, the server counts messages by a hash of your IP address; the address itself is not stored. The counter is deleted after three days."] },
        { heading: "With an account", body: ["We store: your e-mail; your name, language, country and district if you give them; saved places and flights; “My route”; places you have been to; your Astra AI conversations and how many messages you sent today.", "The data is kept in a Supabase database (Europe) behind access rules: every user sees only their own records."] },
        { heading: "Astra AI", body: ["To get an answer, your message and data from the guide are sent to OpenAI. We ask OpenAI not to store the requests (store: false).", "Admins see only how many messages were sent and when. They see the text of a conversation only if you choose “Show to support”."] },
        { heading: "How long we keep it", body: ["For as long as you have an account. You can delete Astra AI conversations in the chat at any time."] },
        { heading: "Deleting your account", body: ["Open “Account” → “Delete account” and confirm with the word shown. The account and everything linked to it are deleted at once and cannot be restored."] },
      ],
    },
    ja: {
      title: "プライバシーポリシー",
      lead: "AstraTravelが保存するデータ、その目的、削除方法について。",
      updated: "2026年11月28日更新。",
      sections: [
        { heading: "ログインしない場合", body: ["アカウントがない場合、お気に入り、「マイルート」、訪問済みの記録、設定はお使いのブラウザにのみ保存され、私たちには送られません。", "登録せずにAstra AIへメッセージを送る場合、サーバーはIPアドレスのハッシュでメッセージ数を数えます。アドレス自体は保存しません。カウンターは3日後に削除されます。"] },
        { heading: "アカウントがある場合", body: ["保存するもの：メールアドレス、入力された場合は名前・言語・国・地区、お気に入りのスポットと航空券、「マイルート」、訪問済みの記録、Astra AIとの会話と1日のメッセージ数。", "データはSupabaseのデータベース（欧州リージョン）にアクセスルール付きで保存され、各ユーザーは自分の記録だけを見ることができます。"] },
        { heading: "Astra AI", body: ["回答を得るため、メッセージとガイドのデータをOpenAIに送信します。OpenAIにはリクエストを保存しないよう指定しています（store: false）。", "管理者が見られるのはメッセージの件数と時刻だけです。会話の本文は、あなたが「サポートに表示」を選んだ場合にのみ表示されます。"] },
        { heading: "保存期間", body: ["アカウントがある間保存します。Astra AIとの会話はチャットからいつでも削除できます。"] },
        { heading: "アカウントの削除", body: ["「アカウント」→「アカウントを削除」を開き、表示された言葉を入力して確認してください。アカウントと関連データはすぐに削除され、元に戻せません。"] },
      ],
    },
  },
  terms: {
    ru: {
      title: "Условия использования",
      lead: "Коротко о правилах AstraTravel.",
      updated: "Обновлено 28 ноября 2026 года.",
      sections: [
        { heading: "Что это", body: ["AstraTravel — бесплатный путеводитель по Казахстану. Цены, время и рейсы — ориентиры для планирования; перед поездкой уточняйте их у мест и перевозчиков."] },
        { heading: "Astra AI", body: ["После входа доступно ограниченное число сообщений Astra AI в день (сейчас — 15; лимит обновляется в 00:00 по времени Алматы). Число может меняться.", "Ответы ИИ — подсказки, а не гарантия. Не отправляйте в чат пароли, номера карт и другие личные данные. В экстренной ситуации звоните 112."] },
        { heading: "Правила", body: ["Нельзя обходить лимиты, создавать аккаунты автоматически или использовать сервис для спама. За нарушения аккаунт может быть заблокирован."] },
        { heading: "Фото", body: ["Фотографии мест взяты с Wikimedia Commons под свободными лицензиями; авторы указаны в разделе «Авторы фото»."] },
      ],
    },
    kk: {
      title: "Пайдалану шарттары",
      lead: "AstraTravel ережелері қысқаша.",
      updated: "2026 жылғы 28 қарашада жаңартылды.",
      sections: [
        { heading: "Бұл не", body: ["AstraTravel — Қазақстан бойынша тегін жолнұсқа. Бағалар, уақыт пен рейстер — жоспарлауға арналған бағдар; сапар алдында оларды орындар мен тасымалдаушылардан нақтылаңыз."] },
        { heading: "Astra AI", body: ["Кіргеннен кейін күніне шектеулі Astra AI хабарламасы қолжетімді (қазір — 15; шектеу Алматы уақытымен 00:00-де жаңарады). Сан өзгеруі мүмкін.", "ЖИ жауаптары — кеңес, кепілдік емес. Чатқа құпиясөз, карта нөмірі және басқа жеке деректерді жібермеңіз. Төтенше жағдайда 112-ге қоңырау шалыңыз."] },
        { heading: "Ережелер", body: ["Шектеулерді айналып өтуге, аккаунттарды автоматты түрде жасауға немесе сервисті спамға пайдалануға болмайды. Бұзушылық үшін аккаунт бұғатталуы мүмкін."] },
        { heading: "Фото", body: ["Орындардың суреттері Wikimedia Commons-тан еркін лицензиялармен алынған; авторлары «Фото авторлары» бөлімінде көрсетілген."] },
      ],
    },
    en: {
      title: "Terms of use",
      lead: "The rules of AstraTravel, briefly.",
      updated: "Updated 28 November 2026.",
      sections: [
        { heading: "What it is", body: ["AstraTravel is a free guide to Kazakhstan. Prices, times and flights are estimates for planning; check them with the places and carriers before you go."] },
        { heading: "Astra AI", body: ["Signed-in users get a limited number of Astra AI messages a day (currently 15; the limit renews at 00:00 Almaty time). The number may change.", "AI answers are suggestions, not guarantees. Do not send passwords, card numbers or other personal data in the chat. In an emergency, call 112."] },
        { heading: "Rules", body: ["Do not get around the limits, create accounts automatically or use the service for spam. Accounts that do may be blocked."] },
        { heading: "Photos", body: ["Place photos come from Wikimedia Commons under free licences; the authors are listed under “Photo credits”."] },
      ],
    },
    ja: {
      title: "利用規約",
      lead: "AstraTravelのルールの概要です。",
      updated: "2026年11月28日更新。",
      sections: [
        { heading: "サービスについて", body: ["AstraTravelはカザフスタンの無料ガイドです。料金・所要時間・航空券は計画用の目安です。出発前にスポットや航空会社でご確認ください。"] },
        { heading: "Astra AI", body: ["ログインすると、1日に一定数のAstra AIメッセージを利用できます（現在15件。アルマトイ時間の0時に更新）。件数は変更される場合があります。", "AIの回答は提案であり、保証ではありません。パスワードやカード番号などの個人情報はチャットに送らないでください。緊急時は112に電話してください。"] },
        { heading: "ルール", body: ["制限の回避、アカウントの自動作成、スパム目的での利用は禁止です。違反したアカウントはブロックされることがあります。"] },
        { heading: "写真", body: ["スポットの写真はWikimedia Commonsの自由ライセンス画像です。作者は「写真のクレジット」に記載しています。"] },
      ],
    },
  },
};
