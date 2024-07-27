# React / Not Uygulaması için Back-End

Bu proje, React ile yaılmış not uygulaması için bir back-end yazılımıdır.

## Kurulum
Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları takip edebilirsiniz:
1. **Depoyu Klonlayın:**
   ```bash
    git clone https://github.com/EmreCeylan05/noteAppBackEnd.git
    cd noteAppBackEnd
2. **Veritabanı için RethinkDB kullanın**
  - Veri tabanı için local ağınızda RethinkDB programını çalıştırınız.
   - `notes` adında bir tablo oluşturun.
   - Bu tabloya ikincil anahtar olarak `title`,`content`,`priority`,`password`,`owner`,`lockStatus` anahtarlarını ekleyin.
   - `users` adında bir tablo oluşturun.
   - Bu tabloya ikincil anahtar olarak `password` ve `username` anahtarlarını ekleyin.
3. **Sunucu için bağımlılıkları kurun**
    ```bash
    cd noteAppBackEnd
    npm install
    node index.js
4. **Sunucuyu ayağa kaldırın**
    ```bash
    cd noteAppBackEnd
    node index.js
