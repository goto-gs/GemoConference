# Room
[Live example](https://example.webrtc.ecl.ntt.com/room/index.html)

使ったAPI：SkyWay
https://webrtc.ecl.ntt.com/

疲れた・・

特に画面共有
けど、終わってみれば超簡潔

peerとRTCpeerConnectionがごっちゃになってたのが敗因

残りは粛々と進んだなー

なんだかんだで、skyWayのドキュメントが親切だった（古いけど）

くそ詰んだポイント：画面共有
自分のビデオを相手にpeerで通信して見せるのはチュートリアルでさくっと終わるのだが、
画面共有のstreamに自分のビデオを差し替える方法がわからず半日は使った。（ほぼ現実逃避で漫画読んでたけど

    // 画面共有の開始
    screenSwitch.addEventListener('click', onClickShare);

    async function onClickShare() {
      try {
        let mediaStream = await navigator.mediaDevices.getDisplayMedia({ video: true });

        // 既存のストリームを画面共有のストリームに置換
        room.replaceStream(mediaStream);

      } catch (e) {
        console.log('Unable to acquire screen capture: ' + e);
      }
    }

このroom.replaceStream();にたどり着くまでにめっちゃ時間かかった・・・
画面共有の考え方は以下リンクを参考にした

https://qiita.com/massie_g/items/f852680b16c1b14cb9e8

※webRTCに関わる調べ物について：いろんなサイトに画面共有はchromeの拡張機能入れないと無理みたいなこと書いてるけど幻術なので注意。（古い情報が多い

しかし、ここで語られている通りにマルチストリームしようとするとaddTrack is not a function で詰む。
それは私がここで出てくるpeerをRTCpeerConnectionとイコールだと思っていたせい。。。

答えはskyWayの公式ドキュメントにある。
最初からこっちのpeerのドキュメント見とけば、寝不足にならずに済んだのに。。

まあいいや。

とにかくその中に出て来たreplaceStream()に救われた。


あとは、なんだろ。
とにかくJSで書いた。以上、報告終わり。
