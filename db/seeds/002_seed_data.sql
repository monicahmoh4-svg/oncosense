-- OncoSense Seed Data — All Kenya hospitals by county

INSERT INTO users (id,email,phone,password_hash,role,first_name,last_name,is_active,is_verified)
VALUES ('a0000000-0000-0000-0000-000000000001','admin@oncosense.health','+254700000001',
'$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfhLm/6m3X.2V4RESnGQrCi','admin','System','Administrator',true,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id,email,phone,password_hash,role,first_name,last_name,is_active,is_verified)
VALUES ('a0000000-0000-0000-0000-000000000002','dr.amina@oncosense.health','+254700000002',
'$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfhLm/6m3X.2V4RESnGQrCi','clinician','Dr. Amina','Hassan',true,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id,email,phone,password_hash,role,first_name,last_name,is_active,is_verified)
VALUES ('a0000000-0000-0000-0000-000000000003','chw.john@oncosense.health','+254700000003',
'$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfhLm/6m3X.2V4RESnGQrCi','health_worker','John','Mwangi',true,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id,email,phone,password_hash,role,first_name,last_name,is_active,is_verified)
VALUES ('a0000000-0000-0000-0000-000000000004','attendant.knh@oncosense.health','+254700000004',
'$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfhLm/6m3X.2V4RESnGQrCi','clinician','KNH','Attendant',true,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id,email,phone,password_hash,role,first_name,last_name,is_active,is_verified)
VALUES ('a0000000-0000-0000-0000-000000000005','attendant.coast@oncosense.health','+254700000005',
'$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfhLm/6m3X.2V4RESnGQrCi','clinician','Coast General','Attendant',true,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id,email,phone,password_hash,role,first_name,last_name,is_active,is_verified)
VALUES ('a0000000-0000-0000-0000-000000000006','attendant.mtrh@oncosense.health','+254700000006',
'$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfhLm/6m3X.2V4RESnGQrCi','clinician','MTRH','Attendant',true,true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO clinics (name,type,address,country,region,district,latitude,longitude,phone,services,resource_level) VALUES

-- NAIROBI COUNTY
('Kenyatta National Hospital','hospital','Hospital Road, Upper Hill, Nairobi','Kenya','Nairobi','Nairobi Central',-1.3006,36.8076,'+254202726300',ARRAY['cervical_screening','mammography','oncology','pathology','chemotherapy','radiotherapy'],'high'),
('Nairobi Hospital','hospital','Argwings Kodhek Road, Nairobi','Kenya','Nairobi','Hurlingham',-1.2979,36.8132,'+254203845000',ARRAY['cervical_screening','mammography','oncology','pathology','mri'],'high'),
('Aga Khan University Hospital Nairobi','hospital','3rd Parklands Avenue, Nairobi','Kenya','Nairobi','Parklands',-1.2618,36.8177,'+254203662000',ARRAY['cervical_screening','mammography','oncology','chemotherapy','radiotherapy'],'high'),
('Karen Hospital','hospital','Karen Road, Karen, Nairobi','Kenya','Nairobi','Karen',-1.3166,36.7173,'+254709876000',ARRAY['cervical_screening','mammography','oncology','pathology'],'high'),
('MP Shah Hospital','hospital','Shivachi Road, Parklands, Nairobi','Kenya','Nairobi','Parklands',-1.2605,36.8206,'+254203748000',ARRAY['cervical_screening','mammography','oncology'],'high'),
('Mbagathi County Hospital','hospital','Mbagathi Way, Nairobi','Kenya','Nairobi','Langata',-1.3167,36.7833,'+254202002555',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Pumwani Maternity Hospital','hospital','Eastleigh North, Nairobi','Kenya','Nairobi','Pumwani',-1.2741,36.8519,'+254202119000',ARRAY['cervical_screening','reproductive_health'],'medium'),
('Mama Lucy Kibaki Hospital','hospital','Outer Ring Road, Embakasi, Nairobi','Kenya','Nairobi','Embakasi',-1.2797,36.8936,'+254202611711',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Mathare Hospital','hospital','Mathare North Road, Nairobi','Kenya','Nairobi','Mathare',-1.2533,36.8611,'+254202613050',ARRAY['basic_cancer_screening'],'medium'),
('Ruaraka Uhai Neema Hospital','hospital','Ruaraka, Nairobi','Kenya','Nairobi','Ruaraka',-1.2369,36.8825,'+254726610000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('St Francis Community Hospital','hospital','Kasarani, Nairobi','Kenya','Nairobi','Kasarani',-1.2200,36.9100,'+254722205141',ARRAY['cervical_screening'],'low'),

-- MOMBASA COUNTY
('Coast General Teaching and Referral Hospital','hospital','Mombasa Road, Mombasa','Kenya','Mombasa','Mombasa Island',-4.0435,39.6682,'+254412312191',ARRAY['cervical_screening','mammography','oncology','pathology','chemotherapy'],'high'),
('Aga Khan Hospital Mombasa','hospital','Vanga Road, Mombasa','Kenya','Mombasa','Mombasa Island',-4.0621,39.6641,'+254412227710',ARRAY['cervical_screening','mammography','oncology','pathology'],'high'),
('Mombasa County Referral Hospital','hospital','Mama Ngina Drive, Mombasa','Kenya','Mombasa','Mombasa Island',-4.0659,39.6682,'+254412222060',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Port Reitz Sub County Hospital','hospital','Port Reitz Road, Mombasa','Kenya','Mombasa','Changamwe',-4.0228,39.5936,'+254412229000',ARRAY['cervical_screening','via_screening'],'medium'),
('Likoni Sub County Hospital','hospital','Likoni, Mombasa','Kenya','Mombasa','Likoni',-4.0825,39.6648,'+254412450000',ARRAY['cervical_screening'],'low'),
('Pandya Memorial Hospital','hospital','Dedan Kimathi Avenue, Mombasa','Kenya','Mombasa','Mombasa Island',-4.0600,39.6650,'+254412230084',ARRAY['cervical_screening','mammography'],'high'),

-- KISUMU COUNTY
('Jaramogi Oginga Odinga Teaching and Referral Hospital','hospital','Kakamega Road, Kisumu','Kenya','Kisumu','Kisumu Central',-0.1022,34.7617,'+254572022777',ARRAY['cervical_screening','mammography','oncology','pathology','chemotherapy'],'high'),
('Aga Khan Hospital Kisumu','hospital','Otieno Oyoo Street, Kisumu','Kenya','Kisumu','Kisumu Central',-0.0956,34.7603,'+254572026401',ARRAY['cervical_screening','mammography','oncology'],'high'),
('Kisumu County Referral Hospital','hospital','Oginga Odinga Road, Kisumu','Kenya','Kisumu','Kisumu East',-0.0920,34.7571,'+254572023671',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Kisumu District Hospital','hospital','Obote Road, Kisumu','Kenya','Kisumu','Kisumu West',-0.1024,34.7518,'+254572020490',ARRAY['cervical_screening','via_screening'],'medium'),
('Lumumba Sub District Hospital','hospital','Lumumba Drive, Kisumu','Kenya','Kisumu','Kisumu Central',-0.1028,34.7523,'+254572022000',ARRAY['cervical_screening'],'low'),

-- NAKURU COUNTY
('Nakuru Level 5 Hospital','hospital','Nakuru-Eldoret Road, Nakuru','Kenya','Nakuru','Nakuru Town',-0.3031,36.0800,'+254512211111',ARRAY['cervical_screening','mammography','oncology','pathology'],'high'),
('War Memorial Hospital Nakuru','hospital','Kenyatta Avenue, Nakuru','Kenya','Nakuru','Nakuru Town',-0.2842,36.0654,'+254512212345',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Naivasha County Referral Hospital','hospital','Naivasha-Nakuru Road, Naivasha','Kenya','Nakuru','Naivasha',-0.7168,36.4328,'+254505020100',ARRAY['cervical_screening','via_screening'],'medium'),
('Gilgil Sub County Hospital','hospital','Gilgil Town, Gilgil','Kenya','Nakuru','Gilgil',-0.5067,36.3183,'+254510020200',ARRAY['cervical_screening'],'low'),
('Rongai Sub County Hospital','hospital','Rongai Town, Rongai','Kenya','Nakuru','Rongai',-0.1667,35.8333,'+254512200000',ARRAY['cervical_screening'],'low'),
('Subukia Sub County Hospital','hospital','Subukia Town, Subukia','Kenya','Nakuru','Subukia',-0.1333,36.1667,'+254512300000',ARRAY['cervical_screening'],'low'),

-- KIAMBU COUNTY
('Thika Level 5 Hospital','hospital','Thika-Garissa Road, Thika','Kenya','Kiambu','Thika',-1.0332,37.0693,'+254672022222',ARRAY['cervical_screening','mammography','oncology','pathology'],'high'),
('Kiambu County Referral Hospital','hospital','Hospital Road, Kiambu','Kenya','Kiambu','Kiambu Town',-1.1713,36.8354,'+254662020400',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Gatundu County Referral Hospital','hospital','Gatundu Town, Gatundu','Kenya','Kiambu','Gatundu',-0.9978,36.9133,'+254713444000',ARRAY['cervical_screening','via_screening'],'medium'),
('Limuru Sub County Hospital','hospital','Limuru Town, Limuru','Kenya','Kiambu','Limuru',-1.1142,36.6423,'+254722000000',ARRAY['cervical_screening'],'low'),
('Tigoni Level 4 Hospital','hospital','Tigoni, Limuru','Kenya','Kiambu','Tigoni',-1.0667,36.7167,'+254722100000',ARRAY['cervical_screening','via_screening'],'medium'),
('Ruiru Level 4 Hospital','hospital','Ruiru Town, Ruiru','Kenya','Kiambu','Ruiru',-1.1432,36.9610,'+254722200000',ARRAY['cervical_screening'],'low'),

-- MACHAKOS COUNTY
('Machakos Level 5 Hospital','hospital','Nairobi Road, Machakos','Kenya','Machakos','Machakos Town',-1.5177,37.2634,'+254452021222',ARRAY['cervical_screening','mammography','oncology','pathology'],'high'),
('Kangundo County Referral Hospital','hospital','Kangundo Town, Kangundo','Kenya','Machakos','Kangundo',-1.4032,37.3488,'+254720000001',ARRAY['cervical_screening','via_screening'],'low'),
('Matuu Sub County Hospital','hospital','Matuu Town, Yatta','Kenya','Machakos','Yatta',-1.1726,37.4878,'+254452023000',ARRAY['cervical_screening'],'low'),
('Mwala Sub County Hospital','hospital','Mwala Town, Mwala','Kenya','Machakos','Mwala',-1.4500,37.3500,'+254720000050',ARRAY['cervical_screening'],'low'),

-- MERU COUNTY
('Meru Teaching and Referral Hospital','hospital','Hospital Road, Meru','Kenya','Meru','Meru Town',0.0442,37.6509,'+254642030500',ARRAY['cervical_screening','mammography','oncology','pathology'],'high'),
('Nkubu Sub County Hospital','hospital','Nkubu Town, Imenti South','Kenya','Meru','Imenti South',0.0033,37.6311,'+254727000001',ARRAY['cervical_screening','via_screening'],'medium'),
('Mitobo Sub County Hospital','hospital','Mitobo, Meru','Kenya','Meru','Buuri',0.2000,37.4000,'+254727000002',ARRAY['cervical_screening'],'low'),
('Igembe Sub County Hospital','hospital','Igembe, Meru','Kenya','Meru','Igembe',0.4833,38.0833,'+254727000003',ARRAY['cervical_screening'],'low'),

-- UASIN GISHU COUNTY
('Moi Teaching and Referral Hospital','hospital','Nandi Road, Eldoret','Kenya','Uasin Gishu','Eldoret',0.5143,35.2698,'+254537773000',ARRAY['cervical_screening','mammography','oncology','pathology','chemotherapy','radiotherapy'],'high'),
('Eldoret Wagon Hospital','hospital','Uganda Road, Eldoret','Kenya','Uasin Gishu','Eldoret',0.5188,35.2841,'+254534633155',ARRAY['cervical_screening','mammography','oncology'],'high'),
('Turbo Sub County Hospital','hospital','Turbo Town, Turbo','Kenya','Uasin Gishu','Turbo',0.6248,35.0394,'+254720000002',ARRAY['cervical_screening'],'low'),
('Burnt Forest Sub County Hospital','hospital','Burnt Forest, Uasin Gishu','Kenya','Uasin Gishu','Ainabkoi',0.5667,35.4333,'+254720000051',ARRAY['cervical_screening'],'low'),

-- KAKAMEGA COUNTY
('Kakamega Teaching and Referral Hospital','hospital','Hospital Road, Kakamega','Kenya','Kakamega','Kakamega Town',0.2833,34.7500,'+254563020000',ARRAY['cervical_screening','mammography','oncology','pathology'],'high'),
('Malava County Referral Hospital','hospital','Malava Town, Malava','Kenya','Kakamega','Malava',0.3667,34.8667,'+254563030000',ARRAY['cervical_screening','via_screening'],'medium'),
('Mumias Sub County Hospital','hospital','Mumias Town, Mumias','Kenya','Kakamega','Mumias',0.3333,34.4833,'+254563040000',ARRAY['cervical_screening'],'low'),
('Butere Sub County Hospital','hospital','Butere Town, Butere','Kenya','Kakamega','Butere',0.2000,34.4833,'+254563050000',ARRAY['cervical_screening'],'low'),

-- BUNGOMA COUNTY
('Bungoma County Referral Hospital','hospital','Hospital Road, Bungoma','Kenya','Bungoma','Bungoma Town',0.5635,34.5606,'+254553020000',ARRAY['cervical_screening','mammography','basic_oncology'],'medium'),
('Webuye County Hospital','hospital','Webuye Town, Webuye','Kenya','Bungoma','Webuye',0.6167,34.7667,'+254553031000',ARRAY['cervical_screening','via_screening'],'medium'),
('Kimilili Sub County Hospital','hospital','Kimilili Town, Kimilili','Kenya','Bungoma','Kimilili',0.7833,34.7167,'+254720000003',ARRAY['cervical_screening'],'low'),
('Chwele Sub County Hospital','hospital','Chwele Town, Chwele','Kenya','Bungoma','Kabuchai',0.6500,34.4667,'+254720000052',ARRAY['cervical_screening'],'low'),

-- KILIFI COUNTY
('Kilifi County Hospital','hospital','Kilifi Town, Kilifi','Kenya','Kilifi','Kilifi Town',-3.6300,39.8500,'+254412522500',ARRAY['cervical_screening','mammography','basic_oncology','pathology'],'high'),
('Malindi County Referral Hospital','hospital','Malindi Town, Malindi','Kenya','Kilifi','Malindi',-3.2187,40.1169,'+254422030200',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Watamu Sub District Hospital','hospital','Watamu Town, Watamu','Kenya','Kilifi','Watamu',-3.3667,40.0167,'+254720000004',ARRAY['cervical_screening'],'low'),
('Kaloleni Sub County Hospital','hospital','Kaloleni Town, Kaloleni','Kenya','Kilifi','Kaloleni',-3.8833,39.7833,'+254720000053',ARRAY['cervical_screening'],'low'),

-- KWALE COUNTY
('Kwale County Referral Hospital','hospital','Kwale Town, Kwale','Kenya','Kwale','Kwale Town',-4.1739,39.4522,'+254409820125',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Msambweni County Referral Hospital','hospital','Msambweni Town, Msambweni','Kenya','Kwale','Msambweni',-4.4667,39.4833,'+254409830000',ARRAY['cervical_screening','via_screening'],'medium'),
('Lungalunga Sub County Hospital','hospital','Lungalunga, Lunga Lunga','Kenya','Kwale','Lunga Lunga',-4.5500,39.1167,'+254720000054',ARRAY['cervical_screening'],'low'),

-- KISII COUNTY
('Kisii Teaching and Referral Hospital','hospital','Hospital Road, Kisii','Kenya','Kisii','Kisii Town',-0.6817,34.7667,'+254583020000',ARRAY['cervical_screening','mammography','oncology','pathology'],'high'),
('Ogembo Sub County Hospital','hospital','Ogembo Town, Kitutu Masaba','Kenya','Kisii','Kitutu Masaba',-0.7833,34.8833,'+254583030000',ARRAY['cervical_screening','via_screening'],'medium'),
('Suneka Sub County Hospital','hospital','Suneka, Bosongo','Kenya','Kisii','Bosongo',-0.7167,34.8167,'+254720000055',ARRAY['cervical_screening'],'low'),

-- NYAMIRA COUNTY
('Nyamira County Referral Hospital','hospital','Hospital Road, Nyamira','Kenya','Nyamira','Nyamira Town',-0.5667,34.9333,'+254589020000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Keroka Sub County Hospital','hospital','Keroka Town, Masaba South','Kenya','Nyamira','Masaba South',-0.7000,34.9667,'+254720000005',ARRAY['cervical_screening'],'low'),
('Manga Sub County Hospital','hospital','Manga Town, Manga','Kenya','Nyamira','Manga',-0.5000,34.9167,'+254720000056',ARRAY['cervical_screening'],'low'),

-- HOMA BAY COUNTY
('Homa Bay County Teaching and Referral Hospital','hospital','Hospital Road, Homa Bay','Kenya','Homa Bay','Homa Bay Town',-0.5264,34.4570,'+254593020000',ARRAY['cervical_screening','mammography','basic_oncology'],'medium'),
('Rachuonyo Sub County Hospital','hospital','Kendu Bay, Kendu Bay','Kenya','Homa Bay','Rachuonyo North',-0.3667,34.6333,'+254720000006',ARRAY['cervical_screening','via_screening'],'low'),
('Suba Sub County Hospital','hospital','Mbita Point, Suba','Kenya','Homa Bay','Suba',-0.4167,34.2000,'+254720000057',ARRAY['cervical_screening'],'low'),

-- MIGORI COUNTY
('Migori County Referral Hospital','hospital','Hospital Road, Migori','Kenya','Migori','Migori Town',-1.0644,34.4731,'+254597020000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Isibania Sub County Hospital','hospital','Isibania Town, Kuria West','Kenya','Migori','Kuria West',-1.3167,34.2667,'+254720000007',ARRAY['cervical_screening'],'low'),
('Rongo Sub County Hospital','hospital','Rongo Town, Rongo','Kenya','Migori','Rongo',-0.7833,34.6167,'+254720000058',ARRAY['cervical_screening'],'low'),

-- SIAYA COUNTY
('Siaya County Referral Hospital','hospital','Hospital Road, Siaya','Kenya','Siaya','Siaya Town',-0.0617,34.2883,'+254572060000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Yala Sub District Hospital','hospital','Yala Town, Gem','Kenya','Siaya','Gem',0.1000,34.5333,'+254720000008',ARRAY['cervical_screening'],'low'),
('Bondo Sub County Hospital','hospital','Bondo Town, Bondo','Kenya','Siaya','Bondo',-0.3333,34.2667,'+254720000059',ARRAY['cervical_screening'],'low'),

-- VIHIGA COUNTY
('Vihiga County Referral Hospital','hospital','Hospital Road, Vihiga','Kenya','Vihiga','Vihiga Town',0.0833,34.7167,'+254556020000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Hamisi Sub County Hospital','hospital','Hamisi Town, Hamisi','Kenya','Vihiga','Hamisi',0.1167,34.6667,'+254720000060',ARRAY['cervical_screening'],'low'),

-- BUSIA COUNTY
('Busia County Referral Hospital','hospital','Hospital Road, Busia','Kenya','Busia','Busia Town',0.4606,34.1117,'+254553060000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Malaba Sub County Hospital','hospital','Malaba Town, Teso North','Kenya','Busia','Teso North',0.6333,34.2833,'+254720000009',ARRAY['cervical_screening'],'low'),
('Butula Sub County Hospital','hospital','Butula Town, Butula','Kenya','Busia','Butula',0.4000,34.0167,'+254720000061',ARRAY['cervical_screening'],'low'),

-- TRANS NZOIA COUNTY
('Kitale County Referral Hospital','hospital','Hospital Road, Kitale','Kenya','Trans Nzoia','Kitale Town',1.0183,34.9958,'+254543020000',ARRAY['cervical_screening','mammography','basic_oncology'],'medium'),
('Endebess Sub County Hospital','hospital','Endebess Town, Endebess','Kenya','Trans Nzoia','Endebess',1.2833,34.8833,'+254720000010',ARRAY['cervical_screening'],'low'),
('Saboti Sub County Hospital','hospital','Saboti, Trans Nzoia','Kenya','Trans Nzoia','Saboti',1.1333,34.9333,'+254720000062',ARRAY['cervical_screening'],'low'),

-- WEST POKOT COUNTY
('Kapenguria County Referral Hospital','hospital','Hospital Road, Kapenguria','Kenya','West Pokot','Kapenguria Town',1.2350,35.1103,'+254547020000',ARRAY['cervical_screening','basic_cancer_screening'],'low'),
('Pokot South Sub County Hospital','hospital','Sigor Town, Pokot South','Kenya','West Pokot','Pokot South',1.0833,35.3167,'+254720000063',ARRAY['cervical_screening'],'low'),

-- ELGEYO MARAKWET COUNTY
('Iten County Referral Hospital','hospital','Hospital Road, Iten','Kenya','Elgeyo Marakwet','Keiyo North',0.6717,35.5083,'+254730000001',ARRAY['cervical_screening','basic_cancer_screening'],'low'),
('Kapsowar County Hospital','hospital','Kapsowar, Marakwet East','Kenya','Elgeyo Marakwet','Marakwet East',1.2000,35.5333,'+254720000064',ARRAY['cervical_screening'],'low'),

-- BARINGO COUNTY
('Kabarnet County Referral Hospital','hospital','Hospital Road, Kabarnet','Kenya','Baringo','Baringo Central',0.4919,35.7417,'+254713000001',ARRAY['cervical_screening','basic_cancer_screening'],'low'),
('Eldama Ravine Sub County Hospital','hospital','Eldama Ravine, Koibatek','Kenya','Baringo','Koibatek',0.0564,35.7219,'+254720000011',ARRAY['cervical_screening'],'low'),
('Marigat Sub County Hospital','hospital','Marigat Town, Tiaty','Kenya','Baringo','Tiaty',0.4667,36.0833,'+254720000065',ARRAY['cervical_screening'],'low'),

-- LAIKIPIA COUNTY
('Nanyuki County Referral Hospital','hospital','Hospital Road, Nanyuki','Kenya','Laikipia','Nanyuki Town',0.0179,37.0720,'+254622020000',ARRAY['cervical_screening','mammography','basic_oncology'],'medium'),
('Nyahururu County Referral Hospital','hospital','Hospital Road, Nyahururu','Kenya','Laikipia','Kinangop',-0.0333,36.3667,'+254620022000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Rumuruti Sub County Hospital','hospital','Rumuruti Town, Laikipia North','Kenya','Laikipia','Laikipia North',0.2667,36.5333,'+254720000066',ARRAY['cervical_screening'],'low'),

-- SAMBURU COUNTY
('Maralal County Referral Hospital','hospital','Hospital Road, Maralal','Kenya','Samburu','Samburu North',1.0983,36.6983,'+254720000012',ARRAY['cervical_screening','basic_cancer_screening'],'low'),
('Wamba Sub County Hospital','hospital','Wamba Town, Samburu East','Kenya','Samburu','Samburu East',0.9667,37.2833,'+254720000067',ARRAY['cervical_screening'],'low'),

-- NYERI COUNTY
('Nyeri County Referral Hospital','hospital','Hospital Road, Nyeri','Kenya','Nyeri','Nyeri Town',-0.4167,36.9500,'+254614020000',ARRAY['cervical_screening','mammography','basic_oncology','pathology'],'high'),
('Karatina Sub District Hospital','hospital','Karatina Town, Mathira','Kenya','Nyeri','Mathira',0.4833,37.1333,'+254614030000',ARRAY['cervical_screening','via_screening'],'medium'),
('Mukurweini Sub County Hospital','hospital','Mukurweini, Mukurweini','Kenya','Nyeri','Mukurweini',-0.5167,36.9000,'+254720000068',ARRAY['cervical_screening'],'low'),
('Tetu Sub County Hospital','hospital','Tetu, Tetu','Kenya','Nyeri','Tetu',-0.5000,36.7667,'+254720000069',ARRAY['cervical_screening'],'low'),

-- KIRINYAGA COUNTY
('Kerugoya County Referral Hospital','hospital','Hospital Road, Kerugoya','Kenya','Kirinyaga','Kirinyaga Central',-0.4989,37.2819,'+254616020000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Kutus Sub County Hospital','hospital','Kutus Town, Gichugu','Kenya','Kirinyaga','Gichugu',-0.5333,37.4500,'+254720000070',ARRAY['cervical_screening'],'low'),

-- MURANG-A COUNTY
('Muranaga Level 5 Hospital','hospital','Hospital Road, Muranaga','Kenya','Murang-a','Muranaga Town',-0.7167,37.1500,'+254609020000',ARRAY['cervical_screening','mammography','basic_oncology'],'medium'),
('Kangema Sub County Hospital','hospital','Kangema Town, Kangema','Kenya','Murang-a','Kangema',-0.8167,36.9833,'+254720000013',ARRAY['cervical_screening'],'low'),
('Maragua Sub County Hospital','hospital','Maragua Town, Kigumo','Kenya','Murang-a','Kigumo',-0.7500,37.0167,'+254720000071',ARRAY['cervical_screening'],'low'),

-- NYANDARUA COUNTY
('Ol Kalou County Referral Hospital','hospital','Hospital Road, Ol Kalou','Kenya','Nyandarua','Ol Kalou Town',-0.2667,36.3667,'+254617020000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Engineer Sub County Hospital','hospital','Engineer Town, Kinangop','Kenya','Nyandarua','Kinangop',-0.6333,36.6333,'+254720000072',ARRAY['cervical_screening'],'low'),

-- EMBU COUNTY
('Embu Level 5 Hospital','hospital','Hospital Road, Embu','Kenya','Embu','Embu Town',-0.5333,37.4500,'+254612020000',ARRAY['cervical_screening','mammography','basic_oncology','pathology'],'high'),
('Runyenjes Sub County Hospital','hospital','Runyenjes Town, Manyatta','Kenya','Embu','Manyatta',-0.3833,37.5667,'+254720000073',ARRAY['cervical_screening'],'low'),

-- THARAKA NITHI COUNTY
('Chuka County Referral Hospital','hospital','Hospital Road, Chuka','Kenya','Tharaka Nithi','Chuka Town',-0.3383,37.6483,'+254720000014',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Marimanti Sub County Hospital','hospital','Marimanti, Tharaka North','Kenya','Tharaka Nithi','Tharaka North',0.0000,38.0000,'+254720000074',ARRAY['cervical_screening'],'low'),

-- ISIOLO COUNTY
('Isiolo County Referral Hospital','hospital','Hospital Road, Isiolo','Kenya','Isiolo','Isiolo Town',0.3542,37.5819,'+254723020000',ARRAY['cervical_screening','basic_cancer_screening'],'low'),
('Garbatulla Sub County Hospital','hospital','Garbatulla, Garbatulla','Kenya','Isiolo','Garbatulla',0.4667,38.5500,'+254720000075',ARRAY['cervical_screening'],'low'),

-- MARSABIT COUNTY
('Marsabit County Referral Hospital','hospital','Hospital Road, Marsabit','Kenya','Marsabit','Marsabit Town',2.3333,37.9833,'+254720000015',ARRAY['cervical_screening','basic_cancer_screening'],'low'),
('Moyale Sub County Hospital','hospital','Moyale Town, Moyale','Kenya','Marsabit','Moyale',3.5333,39.0500,'+254720000076',ARRAY['cervical_screening'],'low'),

-- WAJIR COUNTY
('Wajir County Referral Hospital','hospital','Hospital Road, Wajir','Kenya','Wajir','Wajir Town',1.7500,40.0667,'+254720000016',ARRAY['cervical_screening'],'low'),
('Habaswein Sub County Hospital','hospital','Habaswein, Habaswein','Kenya','Wajir','Habaswein',1.0000,39.5000,'+254720000077',ARRAY['cervical_screening'],'low'),

-- MANDERA COUNTY
('Mandera County Referral Hospital','hospital','Hospital Road, Mandera','Kenya','Mandera','Mandera Town',3.9333,41.8500,'+254720000017',ARRAY['cervical_screening'],'low'),
('Elwak Sub County Hospital','hospital','Elwak Town, Mandera West','Kenya','Mandera','Mandera West',3.9833,40.9167,'+254720000078',ARRAY['cervical_screening'],'low'),

-- GARISSA COUNTY
('Garissa County Referral Hospital','hospital','Hospital Road, Garissa','Kenya','Garissa','Garissa Town',-0.4531,39.6461,'+254467020000',ARRAY['cervical_screening','basic_cancer_screening'],'low'),
('Dadaab Sub County Hospital','hospital','Dadaab, Dadaab','Kenya','Garissa','Dadaab',0.0667,40.3167,'+254720000079',ARRAY['cervical_screening'],'low'),

-- TANA RIVER COUNTY
('Hola County Referral Hospital','hospital','Hospital Road, Hola','Kenya','Tana River','Tana River Town',-1.5000,40.0333,'+254720000018',ARRAY['cervical_screening'],'low'),
('Bura Sub County Hospital','hospital','Bura Town, Bura','Kenya','Tana River','Bura',-1.1333,39.9500,'+254720000080',ARRAY['cervical_screening'],'low'),

-- LAMU COUNTY
('King Fahad County Hospital Lamu','hospital','Hospital Road, Lamu','Kenya','Lamu','Lamu Town',-2.2683,40.9022,'+254424633141',ARRAY['cervical_screening','basic_cancer_screening'],'low'),
('Mokowe Sub County Hospital','hospital','Mokowe, Lamu West','Kenya','Lamu','Lamu West',-2.2333,40.8833,'+254720000081',ARRAY['cervical_screening'],'low'),

-- TAITA TAVETA COUNTY
('Moi County Referral Hospital Voi','hospital','Hospital Road, Voi','Kenya','Taita Taveta','Voi Town',-3.3958,38.5594,'+254437020000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Taveta Sub County Hospital','hospital','Taveta Town, Taveta','Kenya','Taita Taveta','Taveta',-3.3833,37.6833,'+254720000082',ARRAY['cervical_screening'],'low'),

-- KAJIADO COUNTY
('Kajiado County Referral Hospital','hospital','Hospital Road, Kajiado','Kenya','Kajiado','Kajiado Town',-1.8500,36.7833,'+254720000019',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Ngong Sub County Hospital','hospital','Ngong Town, Ngong','Kenya','Kajiado','Ngong',-1.3617,36.6590,'+254720000020',ARRAY['cervical_screening','via_screening'],'low'),
('Loitoktok Sub County Hospital','hospital','Loitoktok Town, Loitoktok','Kenya','Kajiado','Loitoktok',-2.9000,37.5167,'+254720000083',ARRAY['cervical_screening'],'low'),

-- MAKUENI COUNTY
('Makueni County Referral Hospital','hospital','Hospital Road, Makueni','Kenya','Makueni','Makueni Town',-1.8056,37.6289,'+254720000021',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Wote Sub County Hospital','hospital','Wote Town, Kibwezi','Kenya','Makueni','Kibwezi',-1.7833,37.6333,'+254720000022',ARRAY['cervical_screening'],'low'),
('Sultan Hamud Sub County Hospital','hospital','Sultan Hamud, Makindu','Kenya','Makueni','Makindu',-2.0500,37.7333,'+254720000084',ARRAY['cervical_screening'],'low'),

-- KITUI COUNTY
('Kitui County Referral Hospital','hospital','Hospital Road, Kitui','Kenya','Kitui','Kitui Town',-1.3667,38.0167,'+254446020000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Mutomo Sub County Hospital','hospital','Mutomo Town, Kitui South','Kenya','Kitui','Kitui South',-1.8367,38.2117,'+254720000023',ARRAY['cervical_screening'],'low'),
('Mwingi County Hospital','hospital','Mwingi Town, Mwingi','Kenya','Kitui','Mwingi North',-0.9333,38.0667,'+254720000085',ARRAY['cervical_screening'],'low'),

-- BOMET COUNTY
('Bomet County Referral Hospital','hospital','Hospital Road, Bomet','Kenya','Bomet','Bomet Town',-0.7833,35.3417,'+254720000024',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Longisa County Hospital','hospital','Longisa, Chepalungu','Kenya','Bomet','Chepalungu',-0.8833,35.5167,'+254720000086',ARRAY['cervical_screening'],'low'),

-- KERICHO COUNTY
('Kericho County Referral Hospital','hospital','Hospital Road, Kericho','Kenya','Kericho','Kericho Town',-0.3692,35.2861,'+254526020000',ARRAY['cervical_screening','mammography','basic_oncology'],'medium'),
('Litein Sub County Hospital','hospital','Litein Town, Belgut','Kenya','Kericho','Belgut',-0.3667,35.4167,'+254720000087',ARRAY['cervical_screening'],'low'),
('Kapkatet Sub County Hospital','hospital','Kapkatet, Bureti','Kenya','Kericho','Bureti',-0.5833,35.4667,'+254720000088',ARRAY['cervical_screening'],'low'),

-- NANDI COUNTY
('Kapsabet County Referral Hospital','hospital','Hospital Road, Kapsabet','Kenya','Nandi','Kapsabet Town',0.2000,35.1000,'+254532020000',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Nandi Hills Sub County Hospital','hospital','Nandi Hills, Nandi Hills','Kenya','Nandi','Nandi Hills',0.1000,35.1833,'+254720000089',ARRAY['cervical_screening'],'low'),

-- NAROK COUNTY
('Narok County Referral Hospital','hospital','Hospital Road, Narok','Kenya','Narok','Narok Town',-1.0833,35.8667,'+254720000025',ARRAY['cervical_screening','basic_cancer_screening'],'medium'),
('Kilgoris Sub County Hospital','hospital','Kilgoris Town, Trans Mara','Kenya','Narok','Trans Mara',-1.0000,34.8833,'+254720000090',ARRAY['cervical_screening'],'low'),

-- TURKANA COUNTY
('Lodwar County Referral Hospital','hospital','Hospital Road, Lodwar','Kenya','Turkana','Lodwar Town',3.1194,35.5969,'+254543070000',ARRAY['cervical_screening','basic_cancer_screening'],'low'),
('Kakuma Sub County Hospital','hospital','Kakuma, Kakuma','Kenya','Turkana','Kakuma',3.7167,34.8667,'+254720000091',ARRAY['cervical_screening'],'low')

ON CONFLICT DO NOTHING;

-- Health worker record
INSERT INTO health_workers (user_id, worker_id, specialization, assigned_regions, max_patients)
VALUES ('a0000000-0000-0000-0000-000000000003','CHW-KE-001','Community Health & Cancer Screening',ARRAY['Nairobi','Kiambu'],100)
ON CONFLICT (worker_id) DO NOTHING;
