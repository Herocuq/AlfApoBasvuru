//Discord.js ve Gerekli Modülleri Tanımlıyoruz
const { Client, Collection, GatewayIntentBits, Partials, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder, ButtonStyle, ButtonBuilder, PermissionsBitField, ActivityType } = require("discord.js");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fdb = require("croxydb");

const express = require("express");

const app = express();

app.use((req, res) => {
  res.status(200).send("Bot 7/24 Aktif!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Web sunucusu ${PORT} portunda aktif.`);
});

//Bot İçin Gerekli İntentleri Tanımlıyoruz
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

//Komut Koleksiyonunu Oluşturuyoruz
client.commands = new Collection();

//Slash Komutlarını Tanımlıyoruz
const commands = [
    {
        name: 'basvuru',
        description: 'Yetkili Başvuru Sistemini Ayarla!',
        options: [
            {
                type: 7,
                name: "basvuru_kanal",
                description: "Başvuru Kanalını Seç",
                required: true
            },
            {
                type: 7,
                name: "basvuru_log",
                description: "Başvuruların Geleceği Kanalı Seç",
                required: true
            },
            {
                type: 7,
                name: "yetkili_kanal",
                description: "Yetkili Bildirim Kanalını Seç",
                required: true
            },
            {
                type: 7,
                name: "yetkili_kurallari",
                description: "Yetkili Kurallar Kanalını Seç",
                required: true
            },
            {
                type: 7,
                name: "yetkili_chat",
                description: "Yetkili Sohbet Kanalını Seç",
                required: true
            },
            {
                type: 8,
                name: "yetkili_rol",
                description: "Yetkili Rolünü Seç",
                required: true
            },
            {
                type: 8,
                name: "deneme_rol",
                description: "Deneme Yetkili Rolünü Seç",
                required: true
            },
            {
                type: 8,
                name: "normal_rol",
                description: "Normal Yetkili Rolünü Seç",
                required: true
            }
        ]
    },
    {
        name: 'bot-izni',
        description: 'Botun çalışmasına izin verilen sunucuyu ekler',
        options: [
            {
                type: 3,
                name: "sunucu_id",
                description: "İzin verilecek sunucu ID'si",
                required: true
            }
        ]
    },
    {
        name: 'bot-izni-kaldir',
        description: 'Botun çalışmasına izin verilen sunucuyu kaldırır',
        options: [
            {
                type: 3,
                name: "sunucu_id",
                description: "İzni kaldırılacak sunucu ID'si",
                required: true
            }
        ]
    },
    {
        name: 'karaliste',
        description: 'Kara liste komutları',
        options: [
            {
                type: 1,
                name: "ekle",
                description: "Kullanıcıyı veya rolü kara listeye ekle",
                options: [
                    {
                        type: 6,
                        name: "kullanıcı",
                        description: "Kara listeye eklenecek kullanıcı"
                    },
                    {
                        type: 8,
                        name: "rol",
                        description: "Kara listeye eklenecek rol"
                    },
                    {
                        type: 3,
                        name: "sebep",
                        description: "Kara liste sebebi"
                    }
                ]
            },
            {
                type: 1,
                name: "kaldır",
                description: "Kullanıcıyı veya rolü kara listeden kaldır",
                options: [
                    {
                        type: 6,
                        name: "kullanıcı",
                        description: "Kara listeden kaldırılacak kullanıcı"
                    },
                    {
                        type: 8,
                        name: "rol",
                        description: "Kara listeden kaldırılacak rol"
                    }
                ]
            }
        ]
    }
];
//REST API Yapılandırmasını Tanımlıyoruz
const rest = new REST({ version: '10' }).setToken(token);

//Deneme Süreci Yönetim Fonksiyonunu Tanımlıyoruz
async function denemeYonetimi(guild, user) {
    const data = fdb.get(`basvuru_sistem.server_${guild.id}`);
    if (!data) return;

    const yetkiliKanal = guild.channels.cache.get(data.yetkili_kanal);

    //6. Gün Uyarısı (Test İçin 15 Saniye)
    setTimeout(async () => {
        if (yetkiliKanal) {
            yetkiliKanal.send({
                content: `> <a:Dikkat:1294946622031007765> ${user.toString()} Adlı Kişinin Deneme Süreci Yarın Dolacak!`
            });
        }
    }, 15000); // Test için 45 saniye (normal: 6 * 24 * 60 * 60 * 1000)

    //7. Gün Değerlendirmesi (Test İçin 25 Saniye)
    setTimeout(async () => {
        const yetkiliRol = guild.roles.cache.get(data.yetkili_rol);
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`yukselt_${user.id}`)
                    .setLabel('Yükselt')
                    .setEmoji('<:YtMgr:1321573842933645353>')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`uzat_${user.id}`)
                    .setLabel('Süreyi Uzat')
                    .setEmoji('<:Saat:1321571388611629129>')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`dusur_${user.id}`)
                    .setLabel('Yetkiyi Al')
                    .setEmoji('<:Sil:1321571784197410906>')
                    .setStyle(ButtonStyle.Danger)
            );

        if (yetkiliKanal) {
            yetkiliKanal.send({
                content: `> <a:Bildirim:1301175311383138414> <@&${data.yetkili_rol}>\n> ${user.toString()} Adlı Kişinin Deneme Süreci Doldu! Lütfen İşlem Yapın:`,
                components: [row]
            });
        }
    }, 25000); // Test için 1 dakika (normal: 7 * 24 * 60 * 60 * 1000)
}

//Bot Hazır Olduğunda Çalışacak Event
client.once("ready", async () => {
    try {
        console.log("Komutlar yükleniyor...");
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands },
        );
        console.log("Komutlar başarıyla yüklendi!");
    } catch (error) {
        console.error("Komutları yüklerken bir hata oluştu:", error);
    }
    console.log(`${client.user.username} Aktif :)`);
    console.log(`Göreve Hazırım...`);

    //Bot Durumunu Ayarlıyoruz
    const activities = [
        { name: "AlfApo'yu", type: ActivityType.Watching },
        { name: "#FreeDiscord", type: ActivityType.Playing },
        { name: "#DiscordAçılsın", type: ActivityType.Playing }
    ];

    let i = 0;
    setInterval(() => {
        if (i >= activities.length) i = 0;
        const activity = activities[i];
        client.user.setActivity(activity.name, { type: activity.type });
        i++;
    }, 10000);
});

//Sunucu İzin Kontrolü Eventi
client.on("guildCreate", async (guild) => {
    try {
        const owner = await guild.fetchOwner();
        
        //Bot Sahibi veya Sunucu Sahibi Kontrolü
        if(owner.id === owner_id || guild.ownerId === owner_id) {
            fdb.set(`izinli_sunucular.${guild.id}`, true);
            return;
        }

        //İzin Kontrolü
        const izinliMi = fdb.get(`izinli_sunucular.${guild.id}`);
        
        if (!izinliMi) {
            try {
                await owner.send({
                    content: `> <:Developer:1321573041179721819> Oops! Beni Kullanmak İçin Sahibimden İzin Almalısın!\n> **Sahibim : <@1046791434331770910>**`
                });
            } catch (error) {
                console.error('DM gönderilemedi:', error);
            }
            
            await guild.leave();
        }
    } catch (error) {
        console.error('Sunucu kontrol hatası:', error);
    }
});
//Ana Etkileşim Eventi
client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
        //Bot İzin Komutları
        if (interaction.commandName === 'bot-izni') {
            if (interaction.user.id !== owner_id) {
                return interaction.reply({
                    content: '> <:Developer:1321573041179721819> Bu Komutu Sadece Sahibim Kullanabilir!',
                    ephemeral: true
                });
            }

            const sunucuId = interaction.options.getString('sunucu_id');
            fdb.set(`izinli_sunucular.${sunucuId}`, true);

            return interaction.reply({
                content: `> <a:Basarili:1297619808929452054> \`${sunucuId}\` ID'li Sunucu Başarıyla İzinli Listeye Eklendi!`,
                ephemeral: true
            });
        }

        if (interaction.commandName === 'bot-izni-kaldir') {
            if (interaction.user.id !== owner_id) {
                return interaction.reply({
                    content: '> <:Developer:1321573041179721819> Bu Komutu Sadece Sahibim Kullanabilir!',
                    ephemeral: true
                });
            }

            const sunucuId = interaction.options.getString('sunucu_id');
            fdb.delete(`izinli_sunucular.${sunucuId}`);

            return interaction.reply({
                content: `> <a:Basarili:1297619808929452054> \`${sunucuId}\` ID'li Sunucunun İzni Başarıyla Kaldırıldı!`,
                ephemeral: true
            });
        }

        //Başvuru Sistemi Kurulum Komutu
        if (interaction.commandName === 'basvuru') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return await interaction.reply({
                    content: `> <a:Dikkat:1294946622031007765> Bu Komutu Kullanmak için **Yönetici** İznine Sahip Olmalısın!`
                });
            }

            const basvuru_kanal = interaction.options.getChannel('basvuru_kanal');
            const basvuru_log = interaction.options.getChannel('basvuru_log');
            const yetkili_kanal = interaction.options.getChannel('yetkili_kanal');
            const yetkili_kurallari = interaction.options.getChannel('yetkili_kurallari');
            const yetkili_chat = interaction.options.getChannel('yetkili_chat');
            const yetkili_rol = interaction.options.getRole('yetkili_rol');
            const deneme_rol = interaction.options.getRole('deneme_rol');
            const normal_rol = interaction.options.getRole('normal_rol');

            if (yetkili_rol.managed || deneme_rol.managed || normal_rol.managed) {
                return await interaction.reply({
                    content: `> <a:Dikkat:1294946622031007765> Yetkili Rolü Bir Bot Rolü Olamaz!`
                });
            }

            //Başvuru Sistemini Veritabanına Kaydediyoruz
            fdb.set(`basvuru_sistem.server_${interaction.guild.id}`, {
                basvuru_kanal: basvuru_kanal.id,
                basvuru_log: basvuru_log.id,
                yetkili_kanal: yetkili_kanal.id,
                yetkili_kurallari: yetkili_kurallari.id,
                yetkili_chat: yetkili_chat.id,
                yetkili_rol: yetkili_rol.id,
                deneme_rol: deneme_rol.id,
                normal_rol: normal_rol.id
            });

            //Başvuru Butonunu Oluşturuyoruz
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`basvuru-${interaction.guild.id}`)
                        .setLabel(`Başvuru Yap!`)
                        .setEmoji(`<:Basvuru:1303729742855536660>`)
                        .setStyle(ButtonStyle.Primary)
                );

            //Başvuru Embed'ini Oluşturuyoruz
            const basvuruEmbed = new EmbedBuilder()
                .setTitle(`${interaction.guild.name} Yayın Moderatörü Başvurusu`)
                .setDescription(`Yetkili Ekibimize Katılmak İstiyorsan Alttaki **Başvuru Yap!** Butonuna Tıkla!`)
                .setThumbnail(interaction.guild.iconURL())
                .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() });

            //Başvuru Kanalına Mesajı Gönderiyoruz
            basvuru_kanal.send({
                embeds: [basvuruEmbed],
                components: [row]
            });

            //Kurulum Bilgilerini Embed Olarak Gönderiyoruz
            const embed = new EmbedBuilder()
                .setAuthor({ name: `${interaction.user.username}`, iconURL: interaction.user.avatarURL() })
                .addFields({ name: `Başarılı!`, value: `**${interaction.guild.name}** Sunucusu için başvuru sistemi başarıyla ayarlandı! Aşağıda tüm bilgileri görebilirsiniz.` })
                .addFields({
                    name: `Bilgiler`, value: `
\`Başvuru Kanalı: #${basvuru_kanal.name}\`
\`Başvuru Log: #${basvuru_log.name}\`
\`Yetkili Kanal: #${yetkili_kanal.name}\`
\`Yetkili Kuralları: #${yetkili_kurallari.name}\`
\`Yetkili Sohbet: #${yetkili_chat.name}\`
\`Yetkili Rol: @${yetkili_rol.name}\`
\`Deneme Rol: @${deneme_rol.name}\`
\`Normal Rol: @${normal_rol.name}\``
                })
                .setFooter({ text: `Önceden başvuru sistemi açtıysanız başvuru açanların datası sıfırlandı!` });

            await interaction.reply({
                embeds: [embed]
            });
        }
        //Karaliste Komutları
        if (interaction.commandName === 'karaliste') {
            const subcommand = interaction.options.getSubcommand();
            const user = interaction.options.getUser('kullanıcı');
            const role = interaction.options.getRole('rol');
            const reason = interaction.options.getString('sebep') || 'Sebep belirtilmemiş';

            if (interaction.user.id !== owner_id) {
                return interaction.reply({
                    content: '> <:Developer:1321573041179721819> Üzgünüm, Bu Komutu Sadece **Sahibim** Kullanabilir!',
                    ephemeral: true
                });
            }

            //Karaliste Ekleme İşlemleri
            if (subcommand === 'ekle') {
                if (user) {
                    if (fdb.has(`karaliste.user.${user.id}`)) {
                        return interaction.reply({
                            content: `> <a:Dikkat:1294946622031007765> <@${user.id}> Adlı Kullanıcı Zaten Kara Listeye Eklenmiş!`,
                            ephemeral: true
                        });
                    }

                    fdb.set(`karaliste.user.${user.id}`, reason);
                    await interaction.reply({
                        content: `> <a:Basarili:1297619808929452054> <@${user.id}> Kara Listeye Eklendi. Sebep: \`${reason}\``,
                        ephemeral: true
                    });

                    try {
                        await user.send({
                            content: `> <:DcUyari:1321571488368693400> **${interaction.guild.name}** sunucusunda kara listeye eklendiniz!\n> **Sebep:** \`${reason}\``
                        });
                    } catch (error) {
                        console.error('DM gönderilemedi:', error);
                    }
                    return;
                }

                if (role) {
                    if (fdb.has(`karaliste.role.${role.id}`)) {
                        return interaction.reply({
                            content: `> <a:Dikkat:1294946622031007765> <@&${role.id}> Rolü Zaten Kara Listeye Eklenmiş!`,
                            ephemeral: true
                        });
                    }

                    fdb.set(`karaliste.role.${role.id}`, reason);
                    return interaction.reply({
                        content: `> <a:Basarili:1297619808929452054> <@&${role.id}> Rolü Kara Listeye Eklendi. Sebep: \`${reason}\``,
                        ephemeral: true
                    });
                }
            }

            //Karalisteden Kaldırma İşlemleri
            if (subcommand === 'kaldır') {
                if (user) {
                    fdb.delete(`karaliste.user.${user.id}`);
                    return interaction.reply({
                        content: `> <a:Basarili:1297619808929452054> <@${user.id}> Kara Listeden Kaldırıldı. Artık Başvuru Yapabilir!`,
                        ephemeral: true
                    });
                }
                if (role) {
                    fdb.delete(`karaliste.role.${role.id}`);
                    return interaction.reply({
                        content: `> <a:Basarili:1297619808929452054> <@&${role.id}> Rolü Kara Listeden Kaldırıldı. Artık Başvuru Yapabilir!`,
                        ephemeral: true
                    });
                }
            }
        }
    }

    //Buton Etkileşimleri
    if (interaction.isButton()) {
        if (interaction.customId.startsWith(`basvuru-`)) {
            //Sunucu İzin Kontrolü
            const izinliMi = fdb.get(`izinli_sunucular.${interaction.guild.id}`);
            if (!izinliMi && interaction.guild.ownerId !== owner_id) {
                return interaction.reply({
                    content: `> Bu Bot, Bu Sunucuda Kullanılamaz... Kullanmak İçin Sahibimden İzin Almalısın!\n> **Sahibim : [HeRo👑](https://discord.com/users/1046791434331770910)**`,
                    ephemeral: true
                });
            }

            //Karaliste Kontrolleri
            if (fdb.has(`karaliste.user.${interaction.user.id}`)) {
                const reason = fdb.get(`karaliste.user.${interaction.user.id}`);
                return interaction.reply({
                    content: `> <:DcUyari:1321571488368693400> Oops! Botun Kara Listesinde Bulunuyorsun. Bu Yüzden Başvuru Yapamazsın!\n> **Kara Listeye Eklenme Sebebin:** \`${reason}\``,
                    ephemeral: true
                });
            }

            const memberRoles = interaction.member.roles.cache;
            const blacklistedRole = memberRoles.find(role => fdb.has(`karaliste.role.${role.id}`));

            if (blacklistedRole) {
                const reason = fdb.get(`karaliste.role.${blacklistedRole.id}`) || 'Sebep belirtilmemiş';
                return interaction.reply({
                    content: `> <:DcUyari:1321571488368693400> Oops! Üzerindeki <@&${blacklistedRole.id}> Rolü Kara Listeye Eklenmiş. Bu Yüzden Başvuru Yapamazsın!\n> **Bu Rolün Kara Listeye Eklenme Sebebi:** \`${reason}\``,
                    ephemeral: true
                });
            }

            //Önceki Başvuru Kontrolü
            const userHasApplied = fdb.has(`basvuru_sistem.server_${interaction.guild.id}.basvuranlar.${interaction.user.id}`);
            if (userHasApplied) {
                return interaction.reply({
                    content: '> <:Incelenio:1321571866933985302>  Zaten Bir Başvuru Yaptın ve Başvurun İnceleniyor. Başka Bir Başvuru Yapamazsın!',
                    ephemeral: true
                });
            }

            //Başvuru Modalını Oluşturuyoruz
            const modal = new ModalBuilder()
                .setCustomId('basvuru_modal')
                .setTitle('Başvuru');

            const isimInput = new TextInputBuilder()
                .setCustomId('isim')
                .setLabel("Adın Nedir?")
                .setPlaceholder("Gerçek Adınızı Yazın!")
                .setStyle(TextInputStyle.Short);

            const yasInput = new TextInputBuilder()
                .setCustomId('yas')
                .setLabel("Yaşın Kaç?")
                .setPlaceholder("Örnek : Gerçek Yaşınızı Yazın!")
                .setStyle(TextInputStyle.Short);

            const nedenInput = new TextInputBuilder()
                .setCustomId('nedenbiz')
                .setLabel("Neden Biz?")
                .setPlaceholder("Örnek : Çünkü Sizi Yayında Gördüm ve Başvurmak İstedim...Gibi Gibi")
                .setStyle(TextInputStyle.Paragraph);

            const kacsaatInput = new TextInputBuilder()
                .setCustomId('kacsaat')
                .setLabel("Yayın Açtığımızda Aktif Olabilir Misiniz?")
                .setPlaceholder("Örnek : Okul ve Özel Durumlar Dışında Evet, Aktif Olabilirim.")
                .setStyle(TextInputStyle.Paragraph);

            const deneyimInput = new TextInputBuilder()
                .setCustomId('deneyim')
                .setLabel("Moderatörlük Deneyiminiz Var Mı?")
                .setPlaceholder("Örnek : Evet Deneyimim Var. - Ya da Hayır Yok")
                .setStyle(TextInputStyle.Paragraph);

            const row1 = new ActionRowBuilder().addComponents(isimInput);
            const row2 = new ActionRowBuilder().addComponents(yasInput);
            const row3 = new ActionRowBuilder().addComponents(nedenInput);
            const row4 = new ActionRowBuilder().addComponents(kacsaatInput);
            const row5 = new ActionRowBuilder().addComponents(deneyimInput);

            modal.addComponents(row1, row2, row3, row4, row5);
            await interaction.showModal(modal);
        }
        //Başvuru Onaylama Butonu
        if (interaction.customId === `onayla-basvuru`) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;
            const data = fdb.get(`basvuru_sistem.server_${interaction.guild.id}`);
            const basvuranKullanici = fdb.get(`basvuru_sistem.server_${interaction.guild.id}.basvuranlar.basvuru-${interaction.message.id}.user`);
            const user = interaction.guild.members.cache.get(basvuranKullanici);
            const denemeRol = interaction.guild.roles.cache.get(data.deneme_rol);

            //Deneme Rolü Verme ve Bilgilendirme
            user.roles.add(denemeRol).then(async () => {
                const yetkiliChat = interaction.guild.channels.cache.get(data.yetkili_chat);
                const yetkiliKurallari = interaction.guild.channels.cache.get(data.yetkili_kurallari);

                yetkiliChat.send({
                    content: `> <a:ElSallamaMrb:1221542697370648586> Selam ${user}, Aramıza Hoşgeldin! <a:Heyecanli:1300921869070897244>
> 
> 1 Haftalık Deneme Sürecin Resmen Başladı! Bu Süreç Boyunca Deneme Sürecini Tamamlamış Olan Moderatörlere Verilen Uyarı Rolleri, Deneme Sürecin Boyunca Senin İçin Geçerli Olmayacak! 
> 
> Ancak Kural İhlali Durumunda Sözlü Olarak Uyarılacaksın!
> Bu Süreci Başarıyla Tamamlarsan, "Normal Mod" Rolüne Yükselerek, Tam Yetkili Bir Moderatör Olarak Ekibimize Katılmış Olacaksın 🥳
> 
> Bu Yüzden Senden ${yetkiliKurallari} Kanalındaki Kurallarımızı, Dikkatlice Okumanı ve Eksiksiz Bir Şekilde Uygulamanı İstiyoruz.
> Kurallara Uyman, Ekibimizin Güvenini Kazanman ve Burada Kalıcı Olman İçin Çok Önemli.
> 
> Aksi Takdirde, 3.Uyarıda Ekibimizden Çıkarılırsın!
> Son Olarak, Yetkini Kötüye Kullanman Durumunda Botun Kara Listesine Alınarak, Yeniden Başvuru Yapma Hakkını Kaybedersin!
> 
> Tekrardan Aramıza Hoşgeldin! Aklına Takılan Bir Şey Olduğunda Bu Kanaldan Bize Ulaşabilirsin. 
> Yeni Görevinde Sana Başarılar Dileriz, Bu Başarı Hepimizin...`
                });

                //Başvurusu Onaylanan Kullanıcıya DM Gönderme
                try {
                    await user.send({
                        content: `> <:Onaylandi:1321571609227694100> Selam ${user.toString()}, "**${interaction.guild.name}**" Adlı Sunucuya Göndermiş Olduğun Yetkili Başvurusu ${interaction.user.toString()} Tarafından Onaylandı!`
                    });
                } catch (error) {
                    console.error('DM gönderilemedi:', error);
                }

                //Deneme Sürecini Başlatma
                denemeYonetimi(interaction.guild, user);

                interaction.reply({
                    content: `✅ ${user} kullanıcısına deneme yetkisi verildi ve bilgilendirme yapıldı!`,
                    ephemeral: true
                });

                //Başvuru Verilerini Temizleme
                interaction.message.delete().catch(() => {});
                fdb.delete(`basvuru_sistem.server_${interaction.guild.id}.basvuranlar.basvuru-${interaction.message.id}`);
                fdb.delete(`basvuru_sistem.server_${interaction.guild.id}.basvuranlar.${user.id}`);
            }).catch(console.error);
        }

        //Başvuru Reddetme Butonu
        if (interaction.customId === `reddet-basvuru`) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

            const modal = new ModalBuilder()
                .setCustomId(`reddetme_modal-${interaction.message.id}`)
                .setTitle('Başvuruyu Reddetme Sebebi');

            const reasonInput = new TextInputBuilder()
                .setCustomId('reddetme_sebebi')
                .setLabel('Reddetme Sebebi.')
                .setPlaceholder("Örnek: Yetersiz Deneyim, Yetersiz Aktiflik")
                .setStyle(TextInputStyle.Paragraph);

            const row = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
        }

        //Yetkili Yükseltme Butonu
        if (interaction.customId.startsWith('yukselt_')) {
            const userId = interaction.customId.split('_')[1];
            const member = interaction.guild.members.cache.get(userId);
            const data = fdb.get(`basvuru_sistem.server_${interaction.guild.id}`);
            
            if (member && data) {
                const denemeRol = interaction.guild.roles.cache.get(data.deneme_rol);
                const normalRol = interaction.guild.roles.cache.get(data.normal_rol);

                await member.roles.remove(denemeRol);
                await member.roles.add(normalRol);

                try {
                    await member.send({
                        content: `> <a:Heyecanli:1300921869070897244> Tekrardan Selam ${member.toString()},
> "**${interaction.guild.name}**" Adlı Sunucudaki 1 Haftalık Deneme Sürecin Sona Erdi.
> 
> Bu Deneme Sürecini Başarıyla Tamamladın!
> Artık Sende "Normal Mod" Rolüne Yükselerek, Tam Yetkili Bir Moderatör Olarak Ekibimizin Parçası Haline Geldin...
> Bu Başarının Devamını Diliyor ve Kuralları Uygulamaman Durumunda Uyarı Rolleri Alacağını Tekrar Hatırlatmak İstiyoruz!
> 
> Son Olarak Senden Sonra Gelecek Yeni Ekip Arkadaşlarına da Deneme Süreçlerinde Rehberlik Etmeni Bekliyoruz.
> Modluk Deneyimini Geliştirerek, Ekibimize Daha Güçlü Katkılarda Bulunacağına İnanıyoruz.
> Bu Başarın İçin Seni Kutlar ve Tekrardan Tebrik Ederiz...`
                    });
                } catch (error) {
                    console.error('DM gönderilemedi:', error);
                }

                interaction.reply({
                    content: `✅ ${member} kullanıcısı başarıyla yükseltildi!`,
                    ephemeral: true
                });

                interaction.message.delete().catch(() => {});
            }
        }

        //Deneme Süresi Uzatma Butonu
        if (interaction.customId.startsWith('uzat_')) {
            const userId = interaction.customId.split('_')[1];
            const member = interaction.guild.members.cache.get(userId);
            
            const modal = new ModalBuilder()
                .setCustomId(`uzatma_modal-${userId}`)
                .setTitle('Süre Uzatma Sebebi');

            const reasonInput = new TextInputBuilder()
                .setCustomId('uzatma_sebebi')
                .setLabel('Uzatma Sebebi')
                .setPlaceholder('Sebep giriniz...')
                .setStyle(TextInputStyle.Paragraph);

            const row = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
        }

        //Yetkili Düşürme Butonu
        if (interaction.customId.startsWith('dusur_')) {
            const userId = interaction.customId.split('_')[1];
            const member = interaction.guild.members.cache.get(userId);
            
            const modal = new ModalBuilder()
                .setCustomId(`dusurme_modal-${userId}`)
                .setTitle('Yetki Alma Sebebi');

            const reasonInput = new TextInputBuilder()
                .setCustomId('dusurme_sebebi')
                .setLabel('Yetki Alma Sebebi')
                .setPlaceholder('Sebep giriniz...')
                .setStyle(TextInputStyle.Paragraph);

            const row = new ActionRowBuilder().addComponents(reasonInput);
            modal.addComponents(row);

            await interaction.showModal(modal);
        }
    }

    //Modal Submit İşlemleri
    if (interaction.isModalSubmit()) {
        //Başvuru Modalı
        if (interaction.customId === 'basvuru_modal') {
            const data = fdb.get(`basvuru_sistem.server_${interaction.guild.id}`);
            const ad = interaction.fields.getTextInputValue('isim');
            const yas = interaction.fields.getTextInputValue('yas');
            const nedenbiz = interaction.fields.getTextInputValue('nedenbiz');
            const kacsaat = interaction.fields.getTextInputValue('kacsaat');
            const deneyim = interaction.fields.getTextInputValue('deneyim');
            
            const logChannel = interaction.guild.channels.cache.get(data.basvuru_log);

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`onayla-basvuru`)
                        .setLabel(`Başvuruyu Onayla`)
                        .setEmoji(`<:Onaylandi:1321571609227694100>`)
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId(`reddet-basvuru`)
                        .setLabel(`Başvuruyu Reddet`)
                        .setEmoji(`<:Reddedildi:1321571622477627443>`)
                        .setStyle(ButtonStyle.Danger)
                );

            const embed = new EmbedBuilder()
                .setAuthor({ name: `Yeni Bir Başvuru Geldi!`, iconURL: interaction.guild.iconURL() })
                .setThumbnail(interaction.guild.iconURL())
                .addFields(
                    { name: `Adın Nedir?`, value: ad || "Belirtilmemiş", inline: false },
                    { name: `Yaşın Kaç?`, value: yas || "Belirtilmemiş", inline: false },
                    { name: `Neden Biz?`, value: nedenbiz || "Belirtilmemiş", inline: false },
                    { name: `Yayın Açtığımızda Aktif Olabilir Misiniz?`, value: kacsaat || "Belirtilmemiş", inline: false },
                    { name: `Moderatörlük Deneyiminiz Var Mı?`, value: deneyim || "Belirtilmemiş", inline: false },
                    { name: `Etiket`, value: interaction.user.toString(), inline: false },
                    { name: `Kullanıcı ID`, value: interaction.user.id, inline: false }
                )
                .setFooter({
                    text: `Başvuru Tarihi: ${new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul' })} ${new Date().toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul' })}`
                });

            logChannel.send({
                embeds: [embed],
                components: [row]
            }).then(msg => {
                fdb.set(`basvuru_sistem.server_${interaction.guild.id}.basvuranlar.basvuru-${msg.id}`, {
                    user: interaction.user.id,
                    message: msg.id
                });

                fdb.set(`basvuru_sistem.server_${interaction.guild.id}.basvuranlar.${interaction.user.id}`, true);
            });

            interaction.reply({
                content: `✅ Başvuru Yapıldı! Lütfen Başvuru Sonuçlarının Ne Zaman Belli Olacağı Hakkında Sorular Sormayınız!`,
                ephemeral: true
            });
        }

        //Başvuru Reddetme Modalı
        if (interaction.customId.startsWith('reddetme_modal-')) {
            const messageId = interaction.customId.split('-')[1];
            const reason = interaction.fields.getTextInputValue('reddetme_sebebi');
            const data = fdb.get(`basvuru_sistem.server_${interaction.guild.id}`);
            const basvuranKullanici = fdb.get(`basvuru_sistem.server_${interaction.guild.id}.basvuranlar.basvuru-${messageId}.user`);
            const user = interaction.guild.members.cache.get(basvuranKullanici);

            try {
                await user.send({
                    content: `> <:Reddedildi:1321571622477627443> Selam ${user.toString()}, Maalesef "**${interaction.guild.name}**" Adlı Sunucuya Gönderdiğin Yetkili Başvurusu **\`${reason}\`** Sebebiyle ${interaction.user.toString()} Tarafından Reddedildi!`
                });
            } catch (error) {
                console.error('DM gönderilemedi:', error);
            }

            interaction.reply({
                content: `❎ Başvuru reddedildi ve ${user} kullanıcısına bildirildi.`,
                ephemeral: true
            });

            interaction.message.delete().catch(() => {});
            fdb.delete(`basvuru_sistem.server_${interaction.guild.id}.basvuranlar.basvuru-${messageId}`);
            fdb.delete(`basvuru_sistem.server_${interaction.guild.id}.basvuranlar.${user.id}`);
        }

        //Süre Uzatma Modalı
        if (interaction.customId.startsWith('uzatma_modal-')) {
            const userId = interaction.customId.split('-')[1];
            const reason = interaction.fields.getTextInputValue('uzatma_sebebi');
            const member = interaction.guild.members.cache.get(userId);
            const data = fdb.get(`basvuru_sistem.server_${interaction.guild.id}`);

            if (member) {
                denemeYonetimi(interaction.guild, member);
                
                try {
                    await member.send({
                        content: `> <a:Dusunce:1300926224163541004> Tekrardan Selam ${member.toString()},
> "**${interaction.guild.name}**" Adlı Sunucudaki 1 Haftalık Deneme Sürecin Sona Erdi. 
> 
> Ama Deneme Sürecin 1 Hafta Daha Uzatıldı!
> Uzatma Sebebimiz : **\`${reason}\`**`
                    });
                } catch (error) {
                    console.error('DM gönderilemedi:', error);
                }

                interaction.reply({
                    content: `⏳ ${member} kullanıcısının deneme süresi 1 hafta uzatıldı!`,
                    ephemeral: true
                });

                interaction.message.delete().catch(() => {});
            }
        }

        //Yetkili Düşürme Modalı
        if (interaction.customId.startsWith('dusurme_modal-')) {
            const userId = interaction.customId.split('-')[1];
            const reason = interaction.fields.getTextInputValue('dusurme_sebebi');
            const member = interaction.guild.members.cache.get(userId);
            const data = fdb.get(`basvuru_sistem.server_${interaction.guild.id}`);

            if (member && data) {
                const denemeRol = interaction.guild.roles.cache.get(data.deneme_rol);
                await member.roles.remove(denemeRol);

                try {
                    await member.send({
                        content: `> <a:Sad:1300899499673391206> Tekrardan Selam ${member.toString()}, 
> 
> "**${interaction.guild.name}**" Adlı Sunucudaki 1 Haftalık Deneme Sürecin Sona Erdi. 
> 
> Ancak Senden Beklenilen Performansı Tam Olarak Alamadığımızdan Dolayı Yetkin Alındı!
> Yetkini Alma Sebebimiz : **\`${reason}\`**
> 
> Bu Zamana Kadar Göstermiş Olduğun Hizmetten Dolayı Teşekkür Ederiz. 
> Başvurularımız Tekrar Açıldığında, Seni de Daha İyi Bir Performansla Tekrardan Aramızda Görmek İsteriz.
> Umarım Yollarımız Tekrar Kesişir, Kendine İyi Bak ❤`
                    });
                } catch (error) {
                    console.error('DM gönderilemedi:', error);
                }

                interaction.reply({
                    content: `> Başarıyla ${member} kullanıcısının yetkileri alındı!`,
                    ephemeral: true
                });

                interaction.message.delete().catch(() => {});
            }
        }
    }
});

//Etiketlenme Eventi
client.on('messageCreate', async message => {
    const sizinID = owner_id;
    
    if (message.reference) return;
    
    if (message.mentions.users.has(sizinID) || message.content.includes(sizinID)) {
        try {
            const developerEmoji = '<:Developer:1321573041179721819>';
            await message.react(developerEmoji);
        } catch (error) {
            console.error('Tepki eklenirken hata oluştu:', error);
        }
    }
});

//Hata Yakalama
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);

//Bot Girişi
client.login(process.env.TOKEN);