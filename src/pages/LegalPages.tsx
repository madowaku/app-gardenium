import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ScrollText, ShieldCheck, Mail } from 'lucide-react';

const LegalLayout: React.FC<{ title: string; lastUpdated: string; children: React.ReactNode }> = ({ title, lastUpdated, children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#FCFDFB] min-h-screen pt-12 pb-24 px-6 font-sans text-slate-700 leading-relaxed">
      <div className="max-w-3xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-emerald-600 font-medium mb-12 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          戻る / Back
        </button>

        <header className="mb-16 border-b border-slate-100 pb-10">
          <div className="flex items-center gap-3 mb-6 text-emerald-600">
            {title.includes('規約') || title.includes('Terms') ? <ScrollText size={28} /> : <ShieldCheck size={28} />}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{title}</h1>
          <p className="text-sm text-slate-400 font-medium">最終更新日 / Last Updated: {lastUpdated}</p>
        </header>

        <div className="prose prose-slate max-w-none prose-headings:text-slate-900 prose-h2:text-xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:font-bold prose-h2:border-l-4 prose-h2:border-emerald-500 prose-h2:pl-4 prose-p:mb-6 prose-li:mb-2 prose-ul:mb-6">
          {children}
        </div>

        <footer className="mt-20 pt-12 border-t border-slate-100">
          <div className="bg-slate-50 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-bold text-slate-800 mb-1">お問い合わせ / Contact</h4>
              <p className="text-sm text-slate-500">規約およびポリシーに関するご質問はこちらまで / For questions regarding these Terms or the Policy, please contact us here.</p>
            </div>
            <a 
              href="https://forms.gle/FHZoVf1ez5WHbqZb7"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold hover:bg-emerald-50 hover:border-emerald-200 transition-all shadow-sm active:scale-95"
            >
              <Mail size={18} className="text-emerald-500" />
              お問い合わせフォーム / Contact Form
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <LegalLayout title="利用規約 / Terms of Use" lastUpdated="2026-04-22">
      <p>
        この利用規約（以下、「本規約」）は、madowaku（以下、「運営者」）が提供する「<span translate="no">App Gardenium</span>」（以下、「本サービス」）の利用条件を定めるものです。ユーザーは、本サービスを利用することにより、本規約に同意したものとみなされます。<br />
        These Terms of Use ("Terms") set forth the conditions for using "<span translate="no">App Gardenium</span>" ("Service") provided by madowaku ("Operator"). By using the Service, users are deemed to have agreed to these Terms.
      </p>

      <h2>第1条（適用） / Article 1 (Scope)</h2>
      <ul>
        <li>
          本規約は、ユーザーと運営者との間の本サービスの利用に関わる一切の関係に適用されます。<br />
          These Terms apply to all relationships between users and the Operator relating to the use of the Service.
        </li>
        <li>
          運営者は、本規約のほか、本サービスの利用に関するガイドライン、ルール、ヘルプ、注意事項その他の定め（以下、「個別ルール等」）を設けることがあります。<br />
          In addition to these Terms, the Operator may establish guidelines, rules, help materials, notices, and other provisions regarding the use of the Service ("Individual Rules, etc.").
        </li>
        <li>
          個別ルール等は、その名称にかかわらず、本規約の一部を構成するものとします。<br />
          Regardless of their title, such Individual Rules, etc. shall form part of these Terms.
        </li>
        <li>
          本規約と個別ルール等の内容が異なる場合には、個別ルール等に特段の定めがある場合を除き、本規約が優先して適用されます。<br />
          If these Terms conflict with any Individual Rules, etc., these Terms shall prevail unless otherwise specifically provided.
        </li>
      </ul>

      <h2>第2条（本サービスの内容） / Article 2 (Description of the Service)</h2>
      <ul>
        <li>
          本サービスは、個人開発者、クリエイターその他のユーザーが、アイデア、作りかけのアプリ、試作品、スクリーンショット、コメント、フィードバックその他の情報を投稿・共有し、相互に意見交換できる場を提供するサービスです。<br />
          The Service provides a place where indie developers, creators, and other users can post and share ideas, unfinished apps, prototypes, screenshots, comments, feedback, and other information, and exchange opinions with each other.
        </li>
        <li>
          本サービスには、無料機能のほか、有料機能、期間限定機能、実験機能、将来提供される追加機能が含まれる場合があります。<br />
          The Service may include free features, paid features, limited-time features, experimental features, and additional features to be offered in the future.
        </li>
        <li>
          運営者は、ユーザーへの事前通知なく、本サービスの全部または一部を追加、変更、停止または終了することがあります。<br />
          The Operator may add, change, suspend, or terminate all or part of the Service without prior notice to users.
        </li>
      </ul>

      <h2>第3条（利用資格） / Article 3 (Eligibility)</h2>
      <ul>
        <li>
          ユーザーは、本規約に同意し、かつ本サービスの利用に必要な法的能力を有する場合に限り、本サービスを利用できます。<br />
          Users may use the Service only if they agree to these Terms and have the legal capacity necessary to use the Service.
        </li>
        <li>
          未成年者が本サービスを利用する場合には、法定代理人その他保護者の同意を得たうえで利用するものとします。<br />
          If a minor uses the Service, such use must be with the consent of a legal representative or guardian.
        </li>
        <li>
          運営者は、反社会的勢力等に該当する者、過去に本規約違反等により利用停止措置を受けた者、その他運営者が不適切と判断した者の利用を拒否できるものとします。<br />
          The Operator may refuse use of the Service by persons associated with antisocial forces, persons who have previously been suspended for violating these Terms, or any other persons the Operator reasonably considers inappropriate.
        </li>
      </ul>

      <h2>第4条（アカウント） / Article 4 (Accounts)</h2>
      <ul>
        <li>
          ユーザーは、登録情報について、真実、正確かつ最新の情報を提供するものとします。<br />
          Users must provide true, accurate, and up-to-date registration information.
        </li>
        <li>
          ユーザーは、自らの責任においてアカウント情報、認証手段、パスワードその他ログインに必要な情報を管理するものとします。<br />
          Users are responsible for managing their account information, authentication methods, passwords, and other login-related information.
        </li>
        <li>
          ユーザーのアカウントを用いて行われた行為は、当該ユーザー本人による行為とみなします。<br />
          Any acts carried out using a user’s account will be deemed to have been carried out by that user.
        </li>
        <li>
          ユーザーは、アカウントの不正使用またはそのおそれを認識した場合、直ちに運営者へ連絡するものとします。<br />
          If a user becomes aware of unauthorized use of their account or the risk thereof, the user must promptly contact the Operator.
        </li>
        <li>
          ユーザーは、運営者の事前承諾なく、アカウントを第三者に譲渡、貸与、売買、承継その他処分してはなりません。<br />
          Users may not assign, lend, sell, transfer, inherit, or otherwise dispose of their accounts to any third party without the Operator’s prior consent.
        </li>
      </ul>

      <h2>第5条（投稿コンテンツ） / Article 5 (User Content)</h2>
      <ul>
        <li>
          ユーザーは、本サービスに投稿、送信、保存または表示するテキスト、画像、スクリーンショット、プロフィール情報、コメント、リンクその他一切のコンテンツ（以下、「投稿コンテンツ」）について、自ら必要な権利を有していること、または適法に利用可能であることを保証するものとします。<br />
          Users represent and warrant that they have the necessary rights to, or are otherwise lawfully permitted to use, any text, images, screenshots, profile information, comments, links, and all other content that they post, send, store, or display on the Service ("User Content").
        </li>
        <li>
          ユーザーは、投稿コンテンツについて一切の責任を負うものとし、投稿コンテンツが法令または第三者の権利を侵害しないよう自ら確認するものとします。<br />
          Users bear full responsibility for their User Content and must confirm for themselves that such content does not violate applicable laws or infringe the rights of third parties.
        </li>
        <li>
          ユーザーは、運営者に対し、本サービスの提供、維持、改善、不具合対応、モデレーション、表示、翻訳、要約、推薦、広報、バックアップ、障害調査、利用状況分析のために必要な範囲で、投稿コンテンツを無償で使用（複製、公衆送信、表示、翻案、要約、編集、解析を含みますが、これらに限りません。）することを許諾するものとします。<br />
          Users grant the Operator a royalty-free license to use User Content to the extent necessary for providing, maintaining, improving, troubleshooting, moderating, displaying, translating, summarizing, recommending, publicizing, backing up, investigating failures, and analyzing usage of the Service, including but not limited to reproduction, public transmission, display, adaptation, summarization, editing, and analysis.
        </li>
        <li>
          前項の許諾は、本サービスの運営に必要な範囲に限られ、投稿コンテンツ自体の権利が運営者に移転するものではありません。<br />
          The foregoing license is limited to the extent necessary for operation of the Service and does not transfer ownership of the User Content itself to the Operator.
        </li>
        <li>
          運営者は、投稿コンテンツの保存義務を負うものではなく、必要に応じて削除、非公開化、編集、表示制限その他の措置を行うことができます。<br />
          The Operator is not obligated to preserve User Content and may, when necessary, delete it, make it private, edit it, restrict its display, or take other measures.
        </li>
        <li>
          ユーザーが投稿コンテンツを削除した場合でも、システム上のバックアップ、ログ、キャッシュその他技術的理由により、一定期間当該情報が残る場合があります。<br />
          Even if a user deletes User Content, such information may remain for a certain period due to system backups, logs, caches, or other technical reasons.
        </li>
        <li>
          投稿コンテンツの公開範囲、表示順位、露出、推薦、表示継続期間その他の扱いについて、運営者は裁量を有します。<br />
          The Operator has discretion regarding the visibility, display order, exposure, recommendations, duration of display, and other handling of User Content.
        </li>
      </ul>

      <h2>第6条（AI機能および自動処理） / Article 6 (AI Features and Automated Processing)</h2>
      <ul>
        <li>
          本サービスは、AIその他の自動処理技術を用いて、投稿コンテンツの要約、分類、推薦、補助表示、モデレーション補助その他の機能を提供する場合があります。<br />
          The Service may use AI and other automated processing technologies to provide functions such as summarization, classification, recommendation, assistive display, and moderation support for User Content.
        </li>
        <li>
          AIまたは自動処理による出力には、不正確、不完全、不適切な内容が含まれる可能性があります。<br />
          Output generated by AI or automated processing may contain inaccurate, incomplete, or inappropriate content.
        </li>
        <li>
          ユーザーは、AI出力を自己の責任で確認し、必要に応じて修正または採否を判断するものとします。<br />
          Users are responsible for reviewing AI-generated output and deciding whether to revise, adopt, or reject it as appropriate.
        </li>
        <li>
          運営者は、AI出力の正確性、完全性、有用性、特定目的適合性を保証しません。<br />
          The Operator makes no warranty regarding the accuracy, completeness, usefulness, or fitness for a particular purpose of AI-generated output.
        </li>
      </ul>

      <h2>第7条（禁止事項） / Article 7 (Prohibited Conduct)</h2>
      <p>
        ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。<br />
        Users must not engage in any of the following when using the Service:
      </p>
      <ul>
        <li>法令または公序良俗に違反する行為 / Violating laws or public order and morals</li>
        <li>犯罪行為またはこれに関連する行為 / Criminal acts or acts related thereto</li>
        <li>反社会的勢力への利益供与その他これに準ずる行為 / Providing benefits to antisocial forces or similar conduct</li>
        <li>他者の知的財産権、肖像権、パブリシティ権、プライバシー、名誉、信用、その他の権利利益を侵害する行為 / Infringing the intellectual property rights, portrait rights, publicity rights, privacy, honor, credit, or other rights or interests of others</li>
        <li>虚偽または誤解を招く情報を登録または投稿する行為 / Registering or posting false or misleading information</li>
        <li>他者になりすます行為 / Impersonating others</li>
        <li>誹謗中傷、嫌がらせ、脅迫、差別、ヘイト、ストーキングその他他者に精神的・経済的損害または不快感を与える行為 / Defamation, harassment, threats, discrimination, hate, stalking, or other conduct causing mental, economic, or other harm or discomfort to others</li>
        <li>わいせつ、暴力的、残虐、過度に刺激的な表現、または児童虐待・自傷・違法行為を助長する表現を含む投稿 / Posting obscene, violent, cruel, or excessively graphic content, or content promoting child abuse, self-harm, or illegal acts</li>
        <li>無断転載、権利侵害コンテンツ、機密情報、営業秘密、第三者の個人情報等を本人の権限なく投稿する行為 / Posting unauthorized copies, infringing content, confidential information, trade secrets, or third-party personal information without proper authority</li>
        <li>スパム、過度な宣伝、無関係な勧誘、連鎖的投稿、同内容の反復投稿、迷惑メッセージ送信 / Spam, excessive advertising, irrelevant solicitation, chain posting, repetitive posting of the same content, or nuisance messaging</li>
        <li>ボット、スクレイピング、クローリング、過度なリクエスト送信、脆弱性探索、リバースエンジニアリングその他本サービスまたは関連システムに過度な負荷や危険を生じさせる行為 / Using bots, scraping, crawling, excessive requests, vulnerability probing, reverse engineering, or similar acts that impose excessive load or risk on the Service or related systems</li>
        <li>不正アクセス、認証回避、他ユーザー情報の不正取得、セキュリティを害する行為 / Unauthorized access, bypassing authentication, improperly obtaining other users’ information, or undermining security</li>
        <li>本サービスを通じて取得した情報を、当該ユーザーまたは第三者に対する不適切な営業、嫌がらせ、データ収集、学習用収集等に利用する行為 / Using information obtained through the Service for inappropriate solicitation, harassment, data collection, training-data collection, or similar purposes directed at users or third parties</li>
        <li>運営者の許可なく、本サービスの運営・表示・機能を妨害し、またはこれを改変しようとする行為 / Interfering with or attempting to alter the operation, display, or functions of the Service without the Operator’s permission</li>
        <li>本サービスの趣旨に照らして不適切であると運営者が合理的に判断する行為 / Any conduct the Operator reasonably determines to be inappropriate in light of the purpose of the Service</li>
      </ul>

      <h2>第8条（知的財産権） / Article 8 (Intellectual Property Rights)</h2>
      <ul>
        <li>
          本サービスに関するシステム、ソフトウェア、デザイン、UI、ロゴ、文章、画像、データベースその他一切の要素に関する知的財産権その他の権利は、運営者または正当な権利者に帰属します。<br />
          All intellectual property rights and other rights relating to the Service, including its systems, software, design, UI, logos, text, images, databases, and all other elements, belong to the Operator or the legitimate rights holders.
        </li>
        <li>
          ユーザーが投稿したコンテンツに関する権利は、当該ユーザーまたは正当な権利者に留保されます。<br />
          Rights relating to content posted by users remain with the relevant user or the legitimate rights holder.
        </li>
        <li>
          ユーザーは、運営者または正当な権利者の事前承諾なく、本サービスの内容を転載、複製、配布、改変、公衆送信その他の方法で利用してはなりません。<br />
          Users may not reproduce, copy, distribute, modify, publicly transmit, or otherwise use the content of the Service without prior consent of the Operator or the legitimate rights holder.
        </li>
      </ul>

      <h2>第9条（有料機能、料金および支払い） / Article 9 (Paid Features, Fees, and Payments)</h2>
      <ul>
        <li>
          本サービスの一部機能は、有料で提供される場合があります。<br />
          Some features of the Service may be provided for a fee.
        </li>
        <li>
          有料機能の内容、料金、課金単位、支払方法、更新条件、提供期間、利用条件等は、本サービス上、申込画面、決済画面または別途運営者が定める方法により表示されます。<br />
          The details, fees, billing units, payment methods, renewal conditions, service periods, and terms of use for paid features will be displayed within the Service, on the application or payment screens, or by other methods specified by the Operator.
        </li>
        <li>
          ユーザーは、表示された条件に従い、利用料金その他の支払義務を負います。<br />
          Users are responsible for paying usage fees and any other payment obligations in accordance with the displayed conditions.
        </li>
        <li>
          サブスクリプション型サービスが導入される場合、別途表示がない限り、契約期間満了時に自動更新されることがあります。<br />
          If subscription-based services are introduced, they may automatically renew at the end of the subscription period unless otherwise stated.
        </li>
        <li>
          決済は、外部の決済事業者を通じて行われる場合があり、ユーザーは当該事業者の定める規約等にも従うものとします。<br />
          Payments may be processed through external payment service providers, and users must also comply with the terms and policies of such providers.
        </li>
        <li>
          法令上認められる場合または運営者が特に認めた場合を除き、支払済み料金の返金は行いません。<br />
          Except where required by law or specifically approved by the Operator, paid fees are non-refundable.
        </li>
        <li>
          ユーザーが支払を遅滞した場合、運営者は有料機能の停止、利用制限その他必要な措置を講じることができます。<br />
          If a user delays payment, the Operator may suspend paid features, restrict use, or take other necessary measures.
        </li>
      </ul>

      <h2>第10条（外部サービス） / Article 10 (Third-Party Services)</h2>
      <ul>
        <li>
          本サービスは、認証、ホスティング、保存、分析、メール送信、決済その他の目的で第三者が提供する外部サービスと連携する場合があります。<br />
          The Service may integrate with third-party services for authentication, hosting, storage, analytics, email delivery, payments, and other purposes.
        </li>
        <li>
          外部サービスの利用には、当該事業者の利用規約、プライバシーポリシーその他の条件が適用される場合があります。<br />
          Use of third-party services may be subject to the terms of use, privacy policies, and other conditions of the relevant providers.
        </li>
        <li>
          外部サービスに起因してユーザーに損害が生じた場合であっても、運営者に故意または重過失がある場合を除き、運営者は責任を負いません。<br />
          Even if a user suffers damage arising from a third-party service, the Operator shall not be liable unless such damage is caused by the Operator’s willful misconduct or gross negligence.
        </li>
      </ul>

      <h2>第11条（モデレーション、削除申立て、権利侵害対応） / Article 11 (Moderation, Takedown Requests, and Rights Infringement)</h2>
      <ul>
        <li>
          運営者は、本サービスの安全性、適法性、健全性を維持するため、投稿コンテンツの確認、非公開化、削除、修正要請、アカウント制限その他の措置をとることができます。<br />
          To maintain the safety, legality, and soundness of the Service, the Operator may review User Content, make it private, delete it, request corrections, restrict accounts, or take other measures.
        </li>
        <li>
          第三者から権利侵害、違法情報、規約違反等の申立てがあった場合、運営者は、必要に応じて当該投稿の一時非公開化、削除、ユーザーへの照会その他合理的な対応を行うことができます。<br />
          If a third party claims rights infringement, illegal information, a violation of these Terms, or similar issues, the Operator may temporarily hide the relevant content, delete it, inquire with the user, or take other reasonable measures as necessary.
        </li>
        <li>
          ユーザーは、自らの投稿に関して第三者との間で紛争が生じた場合、自らの責任と費用でこれを解決するものとし、運営者に損害を与えた場合にはこれを賠償するものとします。<br />
          If a dispute arises between a user and a third party concerning the user’s content, the user must resolve it at the user’s own responsibility and expense, and must compensate the Operator for any damage caused to the Operator.
        </li>
      </ul>

      <h2>第12条（サービスの停止、中断、終了） / Article 12 (Suspension, Interruption, and Termination)</h2>
      <ul>
        <li>
          運営者は、以下のいずれかに該当する場合、ユーザーへ事前通知なく本サービスの全部または一部を停止または中断することがあります。<br />
          The Operator may suspend or interrupt all or part of the Service without prior notice to users if any of the following applies:
          <ul>
            <li>システム保守、更新、点検、障害対応を行う場合 / Maintenance, updates, inspections, or incident response are required</li>
            <li>通信回線、サーバー、外部サービス等に障害が発生した場合 / Failures occur in communication lines, servers, third-party services, or similar infrastructure</li>
            <li>火災、停電、地震、風水害、感染症、戦争、暴動、労働争議その他の不可抗力が生じた場合 / Fire, power outages, earthquakes, floods, epidemics, war, riots, labor disputes, or other force majeure events occur</li>
            <li>その他、運営者が本サービスの提供が困難と合理的に判断した場合 / The Operator otherwise reasonably determines that provision of the Service is difficult</li>
          </ul>
        </li>
        <li>
          運営者は、前項による停止または中断によりユーザーに生じた損害について、運営者に故意または重過失がある場合を除き、責任を負いません。<br />
          The Operator shall not be liable for damages suffered by users due to such suspension or interruption unless caused by the Operator’s willful misconduct or gross negligence.
        </li>
        <li>
          運営者は、相当の予告期間をもって通知することにより、本サービスの全部または一部を終了することができます。<br />
          The Operator may terminate all or part of the Service by providing notice with a reasonable advance period.
        </li>
      </ul>

      <h2>第13条（利用制限、登録抹消） / Article 13 (Restriction of Use and Account Termination)</h2>
      <ul>
        <li>
          運営者は、ユーザーが以下のいずれかに該当すると判断した場合、事前通知なく、投稿の削除、非公開化、利用制限、有料機能停止、登録抹消その他必要な措置を講じることができます。<br />
          If the Operator determines that a user falls under any of the following, the Operator may, without prior notice, delete content, make content private, restrict use, suspend paid features, terminate registration, or take other necessary measures:
          <ul>
            <li>本規約または個別ルール等に違反した場合 / Violation of these Terms or any Individual Rules, etc.</li>
            <li>登録情報に虚偽があった場合 / False registration information was provided</li>
            <li>支払停止、債務不履行その他信用不安が生じた場合 / Suspension of payment, default, or other credit concerns arise</li>
            <li>長期間利用がない場合 / Long-term inactivity</li>
            <li>運営者からの照会または連絡に対し相当期間応答がない場合 / Failure to respond to the Operator’s inquiries or communications for a considerable period</li>
            <li>その他、運営者が本サービスの利用継続を不適当と合理的に判断した場合 / The Operator otherwise reasonably determines continued use of the Service to be inappropriate</li>
          </ul>
        </li>
        <li>
          前項の措置によりユーザーに損害が生じた場合であっても、運営者に故意または重過失がある場合を除き、責任を負いません。<br />
          The Operator shall not be liable for any damages suffered by the user as a result of such measures unless caused by the Operator’s willful misconduct or gross negligence.
        </li>
      </ul>

      <h2>第14条（退会） / Article 14 (Account Deletion / Withdrawal)</h2>
      <ul>
        <li>
          ユーザーは、運営者所定の方法により、いつでも本サービスの退会を申請できます。<br />
          Users may request withdrawal from the Service at any time by the method prescribed by the Operator.
        </li>
        <li>
          退会後も、法令上必要な範囲、紛争対応上必要な範囲、バックアップその他合理的に必要な範囲で情報が一定期間保持される場合があります。<br />
          Even after withdrawal, information may be retained for a certain period to the extent required by law, necessary for dispute handling, backups, or otherwise reasonably necessary.
        </li>
        <li>
          退会により有料契約が当然に返金されるものではありません。別途表示された条件がある場合はそれに従います。<br />
          Withdrawal does not automatically entitle the user to a refund for paid subscriptions or purchases. If separate refund conditions are displayed, those conditions shall apply.
        </li>
      </ul>

      <h2>第15条（保証の否認） / Article 15 (Disclaimer of Warranties)</h2>
      <ul>
        <li>
          運営者は、本サービスがユーザーの特定目的に適合すること、期待する機能、正確性、有用性、継続性、安全性、完全性、無瑕疵性、第三者権利非侵害性を有することを保証しません。<br />
          The Operator does not warrant that the Service will meet any user’s particular purpose or expectations, or that it will have accuracy, usefulness, continuity, security, completeness, freedom from defects, or non-infringement of third-party rights.
        </li>
        <li>
          本サービス上の投稿、コメント、評価、フィードバック、AI出力その他の情報は、各ユーザーまたはシステムによるものであり、運営者がその真実性、適法性、信頼性、有効性を保証するものではありません。<br />
          Posts, comments, ratings, feedback, AI-generated output, and other information on the Service are provided by users or the system, and the Operator does not guarantee their truthfulness, legality, reliability, or validity.
        </li>
        <li>
          本サービスは、事業、開発、法務、税務、医療その他専門的助言を提供するものではありません。<br />
          The Service does not provide business, development, legal, tax, medical, or other professional advice.
        </li>
      </ul>

      <h2>第16条（免責および責任の制限） / Article 16 (Disclaimer and Limitation of Liability)</h2>
      <ul>
        <li>
          運営者は、本サービスの利用または利用不能、データ消失、アカウント停止、外部サービス障害、第三者行為、投稿内容、AI出力その他に起因してユーザーに生じた損害について、運営者に故意または重過失がある場合を除き、責任を負いません。<br />
          The Operator shall not be liable for damages suffered by users arising from use of or inability to use the Service, loss of data, account suspension, failures of third-party services, acts of third parties, posted content, AI-generated output, or similar causes, unless caused by the Operator’s willful misconduct or gross negligence.
        </li>
        <li>
          運営者が何らかの理由で責任を負う場合であっても、その責任は、ユーザーに現実に生じた通常かつ直接の損害に限られ、逸失利益、特別損害、間接損害、結果的損害については責任を負いません。<br />
          Even if the Operator is liable for any reason, such liability shall be limited to actual, ordinary, and direct damages suffered by the user, and shall not extend to lost profits, special damages, indirect damages, or consequential damages.
        </li>
        <li>
          有料機能に関して運営者が責任を負う場合、その上限は、当該損害発生月の直近3か月間にユーザーが運営者に実際に支払った金額の総額または1,000円のいずれか高い額を上限とします。ただし、運営者に故意または重過失がある場合はこの限りではありません。<br />
          If the Operator is liable in relation to paid features, the maximum liability shall be the greater of: (i) the total amount actually paid by the user to the Operator during the three months immediately preceding the month in which the damage occurred, or (ii) JPY 1,000; provided, however, that this limitation shall not apply in cases of the Operator’s willful misconduct or gross negligence.
        </li>
      </ul>

      <h2>第17条（秘密保持） / Article 17 (Confidentiality)</h2>
      <ul>
        <li>
          ユーザーは、本サービスを通じて非公開または限定公開で知り得た他者の情報を、相手方の承諾なく第三者へ開示または目的外利用してはなりません。<br />
          Users must not disclose to third parties or use for purposes other than intended any information of others learned through the Service that is marked as private or limited-access, without the other party’s consent.
        </li>
        <li>
          ユーザーは、作りかけアプリ、テスト用情報、未公開のアイデア等について、投稿者が非公開または限定公開として扱う趣旨を明示している場合、その趣旨を尊重して取り扱うものとします。<br />
          Users must respect the stated intent of the poster when unfinished apps, test information, unpublished ideas, or similar materials are indicated to be private or limited-access.
        </li>
        <li>
          ただし、運営者は、限定公開情報について完全な秘密保持環境を保証するものではありません。<br />
          However, the Operator does not guarantee a perfectly confidential environment for limited-access information.
        </li>
      </ul>

      <h2>第18条（通知・連絡） / Article 18 (Notices and Communications)</h2>
      <ul>
        <li>
          運営者からユーザーへの通知または連絡は、本サービス上の表示、登録メールアドレスへの送信、その他運営者が適当と判断する方法で行います。<br />
          Notices or communications from the Operator to users may be made through notices within the Service, emails to registered email addresses, or any other method the Operator deems appropriate.
        </li>
        <li>
          ユーザーは、登録メールアドレスその他の連絡先を常に最新の状態に保つものとします。<br />
          Users must keep their registered email addresses and other contact information current.
        </li>
        <li>
          運営者が登録された連絡先に通知または連絡を行った場合、通常到達すべき時点で到達したものとみなします。<br />
          If the Operator sends notice or communication to a registered contact address, it shall be deemed received at the time it would ordinarily be received.
        </li>
      </ul>

      <h2>第19条（規約の変更） / Article 19 (Changes to the Terms)</h2>
      <ul>
        <li>
          運営者は、必要と判断した場合、本規約を変更することができます。<br />
          The Operator may amend these Terms when deemed necessary.
        </li>
        <li>
          変更後の本規約は、本サービス上に表示した時点または運営者が別途定めた効力発生日から効力を生じるものとします。<br />
          The revised Terms become effective when displayed within the Service or from another effective date separately specified by the Operator.
        </li>
        <li>
          ユーザーが変更後も本サービスを利用した場合、変更後の規約に同意したものとみなされます。<br />
          If a user continues to use the Service after the changes take effect, the user is deemed to have agreed to the revised Terms.
        </li>
      </ul>

      <h2>第20条（譲渡禁止） / Article 20 (No Assignment)</h2>
      <p>
        ユーザーは、運営者の事前の書面または電磁的方法による承諾なく、本規約上の地位または本規約に基づく権利義務を第三者に譲渡、移転、担保設定その他処分することはできません。<br />
        Users may not assign, transfer, create security interests in, or otherwise dispose of their status under these Terms or any rights or obligations under these Terms to any third party without the Operator’s prior written or electronic consent.
      </p>

      <h2>第21条（分離可能性） / Article 21 (Severability)</h2>
      <p>
        本規約のいずれかの条項またはその一部が、法令等により無効または執行不能と判断された場合であっても、その他の条項および残存部分は継続して完全に効力を有するものとします。<br />
        If any provision of these Terms or part thereof is found invalid or unenforceable under applicable laws or regulations, the remaining provisions and remaining portions shall continue in full force and effect.
      </p>

      <h2>第22条（準拠法・裁判管轄） / Article 22 (Governing Law and Jurisdiction)</h2>
      <ul>
        <li>
          本規約は、日本法に準拠します。<br />
          These Terms are governed by the laws of Japan.
        </li>
        <li>
          本サービスに関して生じた一切の紛争については、運営者の所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。<br />
          Any disputes arising in connection with the Service shall be subject to the exclusive jurisdiction of the court having jurisdiction over the Operator’s所在地 as the court of first instance.
        </li>
      </ul>

      <h2>第23条（お問い合わせ） / Article 23 (Contact)</h2>
      <p>
        本規約に関するお問い合わせは、以下までお願いいたします。<br />
        For inquiries regarding these Terms, please contact:
      </p>
      <p>
        開発者 / Developer: madowaku<br />
        お問い合わせ / Contact: <a href="https://forms.gle/FHZoVf1ez5WHbqZb7" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">お問い合わせフォーム / Contact Form</a>
      </p>
    </LegalLayout>
  );
};

export const PrivacyPage: React.FC = () => {
  return (
    <LegalLayout title="プライバシーポリシー / Privacy Policy" lastUpdated="2026-04-22">
      <p>
        madowaku（以下、「運営者」）は、「<span translate="no">App Gardenium</span>」（以下、「本サービス」）におけるユーザーの個人情報その他の利用情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」）を定めます。<br />
        madowaku ("Operator") establishes this Privacy Policy ("Policy") regarding the handling of users’ personal information and other usage information in connection with "<span translate="no">App Gardenium</span>" ("Service").
      </p>

      <h2>1. 基本方針 / Basic Policy</h2>
      <p>
        運営者は、ユーザーのプライバシーを尊重し、個人情報の保護に関する法令その他関係法令・ガイドラインに従い、取得した情報を適切に取り扱うよう努めます。<br />
        The Operator respects users’ privacy and will endeavor to handle acquired information appropriately in accordance with applicable laws, regulations, and guidelines concerning the protection of personal information.
      </p>

      <h2>2. 取得する情報 / Information We Collect</h2>
      <p>
        運営者は、本サービスの提供にあたり、以下の情報を取得することがあります。<br />
        In providing the Service, the Operator may collect the following information.
      </p>

      <h3>2-1. ユーザーが入力・投稿する情報 / Information Users Input or Submit</h3>
      <ul>
        <li>名前、表示名、ユーザー名、プロフィール情報 / Name, display name, username, and profile information</li>
        <li>メールアドレス / Email address</li>
        <li>アイデア、説明文、コメント、作りかけアプリに関する情報 / Ideas, descriptions, comments, and information about works-in-progress or unfinished apps</li>
        <li>スクリーンショット、画像、添付ファイルその他アップロードされたコンテンツ / Screenshots, images, attachments, and other uploaded content</li>
        <li>お問い合わせ内容 / Inquiry details</li>
        <li>料金プランの申込みや支払いに関連してユーザーが入力する情報 / Information entered by users in connection with plan applications or payments</li>
        <li>アンケート回答、応募情報、申請情報その他ユーザーが任意に提供する情報 / Survey responses, application information, submission information, and other information voluntarily provided by users</li>
      </ul>

      <h3>2-2. サービス利用に伴い自動的に取得する情報 / Information Automatically Collected Through Use of the Service</h3>
      <ul>
        <li>IPアドレス / IP address</li>
        <li>ブラウザ種別、端末情報、OS情報、言語設定 / Browser type, device information, OS information, and language settings</li>
        <li>アクセス日時、利用日時、参照元情報 / Access timestamps, usage timestamps, and referrer information</li>
        <li>閲覧履歴、操作履歴、利用状況、エラーログ、クラッシュ情報 / Browsing history, action history, usage status, error logs, and crash information</li>
        <li>Cookie、ローカルストレージ、識別子その他類似技術を通じて取得される情報 / Information collected through cookies, local storage, identifiers, and similar technologies</li>
      </ul>

      <h3>2-3. 外部サービス連携により取得する情報 / Information Obtained Through Third-Party Service Integrations</h3>
      <p>
        ユーザーがログイン、決済、分析、メール受信その他の目的で外部サービスを利用する場合、当該外部サービスから提供される範囲の情報を取得することがあります。<br />
        If users use third-party services for login, payments, analytics, receiving emails, or other purposes, the Operator may obtain information provided by such third-party services to the extent made available.
      </p>

      <h3>2-4. 決済関連情報 / Payment-Related Information</h3>
      <p>
        運営者は、決済事業者を通じて課金処理を行う場合があります。この場合、クレジットカード番号等の機微な決済情報は、原則として運営者自身が直接保持せず、決済事業者が取り扱う場合があります。<br />
        The Operator may process payments through payment service providers. In such cases, sensitive payment information such as credit card numbers will, in principle, not be directly stored by the Operator and may instead be handled by the payment service provider.
      </p>

      <h2>3. 利用目的 / Purposes of Use</h2>
      <p>
        取得した情報は、以下の目的で利用します。<br />
        The information collected will be used for the following purposes.
      </p>
      <ol>
        <li>本サービスの提供、運営、維持、本人確認、アカウント管理のため / To provide, operate, maintain, verify identity for, and manage accounts for the Service</li>
        <li>投稿、コメント、画像、プロフィールその他の情報を表示・共有するため / To display and share posts, comments, images, profiles, and other information</li>
        <li>フィードバック要約、分類、推薦、検索性向上その他機能提供のため / To provide features such as feedback summarization, classification, recommendation, and improved searchability</li>
        <li>お問い合わせへの対応、本人確認、サポートのため / To respond to inquiries, verify identity, and provide support</li>
        <li>不正利用、迷惑行為、権利侵害、規約違反、セキュリティ問題への対応のため / To address fraud, abuse, rights infringement, terms violations, and security issues</li>
        <li>サービス改善、機能開発、UI/UX向上、障害調査、品質向上のため / To improve the Service, develop features, enhance UI/UX, investigate incidents, and improve quality</li>
        <li>利用状況の分析、統計作成、性能測定のため / To analyze usage, create statistics, and measure performance</li>
        <li>有料機能の提供、請求、課金管理、返金判断、契約管理のため / To provide paid features, billing, payment administration, refund determinations, and contract management</li>
        <li>重要なお知らせ、規約変更、メンテナンス情報等の通知のため / To send important notices, changes to terms, maintenance information, and similar communications</li>
        <li>キャンペーン、案内、アンケート等の連絡のため / To contact users about campaigns, announcements, surveys, and similar matters</li>
        <li>法令対応、紛争対応、権利保護のため / To comply with laws, handle disputes, and protect rights</li>
      </ol>

      <h2>4. 投稿コンテンツの公開と表示 / Publication and Display of User Content</h2>
      <ul>
        <li>
          ユーザーが本サービスに投稿した内容は、その設定またはサービス仕様に応じて、他のユーザーまたは一般公開範囲から閲覧可能となる場合があります。<br />
          Content posted by users to the Service may, depending on the settings or service specifications, be viewable by other users or by the public.
        </li>
        <li>
          公開された投稿コンテンツには、表示名、プロフィール情報、投稿日時、更新日時その他サービス運営上必要な情報が含まれる場合があります。<br />
          Published user content may include display name, profile information, posting date, update date, and other information necessary for operating the Service.
        </li>
        <li>
          ユーザーは、公開範囲を確認したうえで投稿するものとし、公開された情報については第三者に閲覧、引用、共有される可能性があることを理解するものとします。<br />
          Users are responsible for confirming the visibility settings before posting and acknowledge that publicly available information may be viewed, quoted, or shared by third parties.
        </li>
        <li>
          運営者は、サービス改善、検索性向上、推薦表示、特集表示、広報等の目的で、投稿コンテンツの一部を本サービス内または関連紹介資料上に表示することがあります。<br />
          The Operator may display portions of user content within the Service or in related promotional materials for purposes such as service improvement, searchability enhancement, recommendation display, featured display, and publicity.
        </li>
      </ul>

      <h2>5. AI機能・自動処理における情報利用 / Use of Information in AI Features and Automated Processing</h2>
      <ul>
        <li>
          本サービスでは、要約、分類、推薦、モデレーション補助、表示最適化その他の目的で、AIまたは自動処理技術を利用する場合があります。<br />
          The Service may use AI or automated processing technologies for purposes such as summarization, classification, recommendation, moderation support, display optimization, and other functions.
        </li>
        <li>
          そのため、ユーザーの投稿コンテンツ、操作履歴、利用状況等が、これらの機能の提供・改善のために解析対象となる場合があります。<br />
          Accordingly, user content, activity history, and usage data may be analyzed for the provision and improvement of such functions.
        </li>
        <li>
          実際に利用する外部AIサービスがある場合、当該サービス提供事業者に必要な範囲で情報が送信される場合があります。<br />
          Where external AI services are used in practice, information may be transmitted to the relevant service providers to the extent necessary.
        </li>
        <li>
          運営者は、実装状況に応じて、利用する外部事業者や情報の取扱いを、本サービス上または関連文書において案内するよう努めます。<br />
          The Operator will endeavor, depending on the implementation status, to inform users through the Service or related documents about the third-party providers used and the handling of information.
        </li>
      </ul>

      <h2>6. 第三者提供 / Provision to Third Parties</h2>
      <p>
        運営者は、法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供しません。<br />
        The Operator will not provide personal information to third parties without the individual’s consent, except as required by law.
      </p>
      <p>
        ただし、以下の場合には、サービス提供に必要な範囲で情報の取扱いを第三者に委託し、または共同利用に準ずる形で取り扱わせることがあります。<br />
        However, in the following cases, the Operator may entrust the handling of information to third parties, or have it handled in a manner similar to joint use, to the extent necessary for providing the Service.
      </p>
      <ul>
        <li>ホスティング、認証、データ保存、CDN、アクセス解析等の委託先 / Service providers for hosting, authentication, data storage, CDN, access analytics, and similar functions</li>
        <li>決済処理事業者 / Payment processors</li>
        <li>メール送信、通知配信、カスタマーサポート関連事業者 / Providers related to email delivery, notifications, and customer support</li>
        <li>不正利用対策、障害対応、モデレーション支援に必要な事業者 / Providers necessary for anti-abuse measures, incident response, and moderation support</li>
        <li>AI、分析、検索、監視その他機能提供上必要な事業者 / Providers necessary for AI, analytics, search, monitoring, and other service functions</li>
      </ul>

      <h2>7. 外部サービスの利用 / Use of Third-Party Services</h2>
      <ul>
        <li>
          本サービスでは、認証、ホスティング、分析、決済、通信、AIその他の目的で外部サービスを利用する場合があります。<br />
          The Service may use third-party services for authentication, hosting, analytics, payments, communications, AI, and other purposes.
        </li>
        <li>
          これらの外部サービスにおいては、各事業者のプライバシーポリシー、利用規約等に基づき情報が取り扱われます。<br />
          Information handled by such third-party services is subject to the privacy policies, terms of use, and other policies of each provider.
        </li>
        <li>
          ユーザーは、これら外部サービスの利用に伴い、当該事業者に対して直接情報が送信される場合があることを理解するものとします。<br />
          Users acknowledge that information may be sent directly to such third-party providers in connection with the use of these services.
        </li>
      </ul>

      <h2>8. Cookieその他の識別技術 / Cookies and Similar Technologies</h2>
      <ul>
        <li>
          本サービスは、利便性向上、ログイン状態の維持、設定保存、利用状況分析、不正防止、表示最適化等のために、Cookieその他類似技術を利用することがあります。<br />
          The Service may use cookies and similar technologies for convenience, maintaining login sessions, saving settings, usage analysis, fraud prevention, and display optimization.
        </li>
        <li>
          ユーザーは、ブラウザ設定等によりCookieを制限または無効化できますが、その場合、本サービスの一部機能が利用できなくなることがあります。<br />
          Users may restrict or disable cookies through browser settings or otherwise; however, doing so may cause some functions of the Service to become unavailable.
        </li>
      </ul>

      <h2>9. アクセス解析・ログ / Analytics and Logs</h2>
      <p>
        運営者は、本サービスの改善、安定運用、利用傾向の把握、不正検知等のため、アクセスログ、操作ログ、エラーログその他の技術情報を記録・分析する場合があります。<br />
        The Operator may record and analyze access logs, activity logs, error logs, and other technical information for purposes such as service improvement, stable operation, understanding usage trends, and fraud detection.
      </p>

      <h2>10. 安全管理措置 / Security Measures</h2>
      <ul>
        <li>
          運営者は、取得した情報の漏えい、滅失、毀損、不正アクセスその他のリスクを防止または軽減するため、合理的な範囲で安全管理措置を講じます。<br />
          The Operator will implement reasonable security measures to prevent or mitigate risks such as leakage, loss, damage, unauthorized access, and other threats relating to collected information.
        </li>
        <li>
          ただし、インターネット通信、クラウドサービス、外部サービス連携その他の性質上、完全な安全性を保証するものではありません。<br />
          However, due to the nature of internet communications, cloud services, third-party integrations, and similar factors, complete security cannot be guaranteed.
        </li>
        <li>
          運営者は、実装状況に応じて、アクセス制御、認証、権限管理、ログ管理、バックアップ、委託先管理等の対策を講じるよう努めます。<br />
          Depending on the implementation status, the Operator will endeavor to adopt measures such as access control, authentication, permission management, log management, backups, and vendor management.
        </li>
      </ul>

      <h2>11. 保有期間 / Retention Period</h2>
      <ul>
        <li>
          運営者は、取得した情報を、利用目的の達成に必要な期間または法令上必要な期間保有します。<br />
          The Operator retains collected information for the period necessary to achieve the purposes of use or for the period required by law.
        </li>
        <li>
          退会後または削除依頼後であっても、法令対応、紛争対応、不正防止、課金管理、バックアップ、監査その他合理的に必要な範囲で一定期間情報を保持する場合があります。<br />
          Even after account deletion or a deletion request, information may be retained for a certain period to the extent reasonably necessary for legal compliance, dispute handling, fraud prevention, payment administration, backups, audits, and similar purposes.
        </li>
        <li>
          保有期間経過後は、合理的な方法により削除、匿名化または利用停止措置を講じます。<br />
          After the retention period expires, the information will be deleted, anonymized, or otherwise restricted through reasonable means.
        </li>
      </ul>

      <h2>12. 開示、訂正、削除、利用停止等 / Access, Correction, Deletion, Suspension of Use, etc.</h2>
      <ul>
        <li>
          ユーザーは、法令の定めに従い、自己に関する個人情報について、開示、訂正、追加、削除、利用停止等を求めることができます。<br />
          Users may, in accordance with applicable laws, request disclosure, correction, addition, deletion, suspension of use, and similar actions concerning their personal information.
        </li>
        <li>
          運営者は、本人確認を行ったうえで、法令に従い合理的な範囲で対応します。<br />
          The Operator will respond within a reasonable scope in accordance with applicable laws after verifying the identity of the requester.
        </li>
        <li>
          他のユーザーの権利利益、本サービス運営、法令上の義務、記録保持の必要性等により、希望どおりの対応ができない場合があります。<br />
          In some cases, the requested action may not be carried out as requested due to the rights or interests of other users, operation of the Service, legal obligations, record retention requirements, or similar reasons.
        </li>
      </ul>

      <h2>13. 海外移転の可能性 / International Transfer</h2>
      <p>
        外部サービスの利用形態によっては、取得した情報が日本国外で保管または処理される場合があります。運営者は、実装状況に応じて必要な情報提供や適切な取扱いに努めます。<br />
        Depending on how third-party services are used, collected information may be stored or processed outside Japan. The Operator will endeavor to provide appropriate information and handle such information properly depending on the implementation status.
      </p>

      <h2>14. 未成年者の情報 / Information of Minors</h2>
      <p>
        未成年者が本サービスを利用する場合には、必要に応じて保護者等の同意を得たうえで利用してください。<br />
        If a minor uses the Service, please do so with the consent of a parent or legal guardian where necessary.
      </p>

      <h2>15. 事業承継等 / Business Transfer, Merger, etc.</h2>
      <p>
        運営者が、本サービスに係る事業を譲渡し、または合併、会社分割その他の事由により事業承継を行う場合、取得した情報が承継先に移転されることがあります。<br />
        If the Operator transfers the business related to the Service, or if a business succession occurs due to merger, company split, or another reason, the collected information may be transferred to the successor.
      </p>

      <h2>16. 本ポリシーの変更 / Changes to This Policy</h2>
      <ul>
        <li>
          運営者は、必要に応じて本ポリシーを変更することがあります。<br />
          The Operator may revise this Policy when necessary.
        </li>
        <li>
          重要な変更がある場合には、本サービス上での表示その他適切な方法により周知するよう努めます。<br />
          If there are material changes, the Operator will endeavor to notify users through notices within the Service or by other appropriate means.
        </li>
        <li>
          変更後の本ポリシーは、本サービス上に掲載した時点または別途定めた時点から効力を生じます。<br />
          The revised Policy becomes effective when posted within the Service or at another time separately specified.
        </li>
      </ul>

      <h2>17. お問い合わせ先 / Contact</h2>
      <p>
        本ポリシーに関するお問い合わせは、以下までお願いいたします。<br />
        For inquiries regarding this Policy, please contact:
      </p>
      <p>
        開発者 / Developer: madowaku<br />
        お問い合わせ / Contact: <a href="https://forms.gle/FHZoVf1ez5WHbqZb7" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">お問い合わせフォーム / Contact Form</a>
      </p>
    </LegalLayout>
  );
};
