import { debounce } from "lodash-es"
import Head from "next/head";
import { createRef } from "react";
import styles from "../styles/Index.module.scss";

export default function Index() {
  const sourceLangRef = createRef();
  const destLangRef = createRef();
  const sourceTextArea = createRef();
  const translationTextArea = createRef();

  const translate = async () => {
    try {
      const sourceText = sourceTextArea.current.value;

      if (!sourceText) {
        return;
      }

      const res = await fetch(`${process.env.backendBaseURL}/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceText,
          sourceLang: sourceLangRef.current.value,
        }),
      });
      const { translation } = await res.json();

      translationTextArea.current.value = translation;
    } catch (err) {
      translationTextArea.current.value = "申し訳ありません。翻訳に技術的な問題が発生しています。";
      console.error(err);
    }
  };

  const onSourceLangChange = async () => {
    if (sourceLangRef.current.value === "ja") {
      destLangRef.current.value = "en";
    } else {
      destLangRef.current.value = "ja";
    }

    await translate();
  };

  const onSourceTextChange = debounce(translate, 800);

  const title = "原神 自動翻訳 (日↔英) β";
  const description = "原神に関する固有名詞を含んだ文章の翻訳ができる自動翻訳サイトです。通常の翻訳サイトでは正確な翻訳が難しい、キャラ名、地名、アイテム名などの固有名詞が含まれている文章でも、自動翻訳を行うことが可能です。";
  const canonical = "https://translate.genshin-dictionary.com/";

  return (
    <div className={styles.outerContainer}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />

        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="ja_JP" />
        <meta property="og:site_name" content="原神 自動翻訳" />
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:site" content="@phol_si" />
        <meta property="twitter:creator" content="@phol_si" />
      </Head>

      <div className={styles.innerContainer}>
        <main className={styles.main}>
          <h1 className={styles.title}>
            原神 自動翻訳 (日↔英) β
          </h1>

          <div className={styles.translator}>
            <div className={styles.translatorLang}>
              <select ref={sourceLangRef} defaultValue="en" onChange={onSourceLangChange}>
                <option value="en">英語 - English</option>
                <option value="ja">日本語 - Japanese</option>
              </select>
              <textarea rows="5" cols="1" placeholder="原文を入力して下さい。秘密情報は入力しないで下さい。" ref={sourceTextArea} onChange={onSourceTextChange}></textarea>
            </div>

            <div className={styles.translatorLang}>
              <select ref={destLangRef} defaultValue="ja" disabled>
                <option value="en">英語 - English</option>
                <option value="ja">日本語 - Japanese</option>
              </select>
              <textarea rows="5" cols="1" placeholder="翻訳文がここに表示されます。" ref={translationTextArea} disabled></textarea>
            </div>
          </div>
        </main>

        <p className={styles.about}>
          これはゲーム「<a href="https://genshin.hoyoverse.com" target="_blank" rel="noreferrer">原神</a>」のための自動翻訳ツールです。通常の翻訳ツールでは正確な翻訳が難しい、キャラ名、地名、アイテム名などの固有名詞が含まれている文章でも、自動翻訳を行うことが可能です。<br />
          本サイトは翻訳エンジンとして、<a href="https://www.nict.go.jp/" target="_blank" rel="noreferrer">国立研究開発法人 情報通信研究機構 (NICT)</a> が提供する<a href="https://mt-auto-minhon-mlt.ucri.jgn-x.jp/" target="_blank" rel="noreferrer">みんなの自動翻訳@TexTra</a>を利用しています。<br />
          入力した情報は、本サイトの管理者が翻訳精度向上のために利用する他、NICT によって研究目的で利用される場合がありますので、<strong>秘密情報や個人情報は入力しないようご注意下さい</strong>。
        </p>

        <footer>
          &copy; 2022 <a href="https://twitter.com/phol_si" target="_blank" rel="noreferrer">@phol_si</a> / Translation engine powered by <a href="https://www.nict.go.jp/" target="_blank" rel="noreferrer">NICT</a>
        </footer>
      </div>
    </div>
  )
}
