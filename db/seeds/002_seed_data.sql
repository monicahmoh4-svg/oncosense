-- OncoSense — Kenya all 47 counties, public + private hospitals, SHA/NHIF/insurance

INSERT INTO users (id,email,phone,password_hash,role,first_name,last_name,is_active,is_verified) VALUES
('a0000000-0000-0000-0000-000000000001','admin@oncosense.health','+254700000001','$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfhLm/6m3X.2V4RESnGQrCi','admin','System','Administrator',true,true),
('a0000000-0000-0000-0000-000000000002','dr.amina@oncosense.health','+254700000002','$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfhLm/6m3X.2V4RESnGQrCi','clinician','Dr. Amina','Hassan',true,true),
('a0000000-0000-0000-0000-000000000003','chw.john@oncosense.health','+254700000003','$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeJfhLm/6m3X.2V4RESnGQrCi','health_worker','John','Mwangi',true,true)
ON CONFLICT (id) DO NOTHING;

-- Wipe old incomplete clinic data and re-insert complete set
DELETE FROM clinics WHERE country = 'Kenya';

INSERT INTO clinics (name,type,address,country,region,district,latitude,longitude,phone,services,insurance_accepted,resource_level,ownership) VALUES
-- NAIROBI
('Kenyatta National Hospital','hospital','Hospital Rd, Upper Hill, Nairobi','Kenya','Nairobi','Nairobi Central',-1.3006,36.8076,'+254202726300',ARRAY['cervical_screening','mammography','oncology','pathology','chemotherapy','radiotherapy','surgery','hematology'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC','Britam','Resolution'],'high','public'),
('Nairobi Hospital','hospital','Argwings Kodhek Rd, Nairobi','Kenya','Nairobi','Hurlingham',-1.2979,36.8132,'+254203845000',ARRAY['cervical_screening','mammography','oncology','pathology','mri','pet_scan','chemotherapy','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC','Britam','Resolution','UAP','Madison'],'high','private'),
('Aga Khan University Hospital Nairobi','hospital','3rd Parklands Ave, Nairobi','Kenya','Nairobi','Parklands',-1.2618,36.8177,'+254203662000',ARRAY['cervical_screening','mammography','oncology','chemotherapy','radiotherapy','pathology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC','Britam','Resolution','UAP','Madison','Sanlam'],'high','private'),
('Karen Hospital','hospital','Karen Rd, Nairobi','Kenya','Nairobi','Karen',-1.3166,36.7173,'+254709876000',ARRAY['cervical_screening','mammography','oncology','pathology','surgery','chemotherapy'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC','Britam','Resolution','UAP'],'high','private'),
('MP Shah Hospital','hospital','Shivachi Rd, Parklands, Nairobi','Kenya','Nairobi','Parklands',-1.2605,36.8206,'+254203748000',ARRAY['cervical_screening','mammography','oncology','pathology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC','Britam','Resolution'],'high','private'),
('Mbagathi County Hospital','hospital','Mbagathi Way, Nairobi','Kenya','Nairobi','Langata',-1.3167,36.7833,'+254202002555',ARRAY['cervical_screening','via_screening','basic_cancer_screening','surgery'],ARRAY['SHA','NHIF'],'medium','public'),
('Pumwani Maternity Hospital','hospital','Eastleigh North, Nairobi','Kenya','Nairobi','Pumwani',-1.2741,36.8519,'+254202119000',ARRAY['cervical_screening','reproductive_health','gynecology'],ARRAY['SHA','NHIF'],'medium','public'),
('Mama Lucy Kibaki Hospital','hospital','Outer Ring Rd, Embakasi, Nairobi','Kenya','Nairobi','Embakasi',-1.2797,36.8936,'+254202611711',ARRAY['cervical_screening','basic_cancer_screening','surgery'],ARRAY['SHA','NHIF'],'medium','public'),
('Kenyatta University Teaching Hospital','hospital','Thika Rd, Nairobi','Kenya','Nairobi','Roysambu',-1.1814,36.9292,'+254700600000',ARRAY['cervical_screening','oncology','pathology','surgery'],ARRAY['SHA','NHIF'],'high','public'),
('Nairobi West Hospital','hospital','Ngong Rd, Nairobi','Kenya','Nairobi','Nairobi West',-1.3198,36.8010,'+254700007000',ARRAY['cervical_screening','mammography','oncology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC','Britam'],'high','private'),
('Gertrudes Childrens Hospital','hospital','Muthaiga Rd, Nairobi','Kenya','Nairobi','Muthaiga',-1.2596,36.8319,'+254203763000',ARRAY['pediatric_oncology','pathology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC','Britam'],'high','private'),
-- MOMBASA
('Coast General Teaching and Referral Hospital','hospital','Mombasa Rd, Mombasa','Kenya','Mombasa','Mombasa Island',-4.0435,39.6682,'+254412312191',ARRAY['cervical_screening','mammography','oncology','pathology','chemotherapy','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'high','public'),
('Aga Khan Hospital Mombasa','hospital','Vanga Rd, Mombasa','Kenya','Mombasa','Mombasa Island',-4.0621,39.6641,'+254412227710',ARRAY['cervical_screening','mammography','oncology','pathology','surgery','chemotherapy'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC','Britam','Resolution','UAP'],'high','private'),
('Port Reitz Sub County Hospital','hospital','Port Reitz Rd, Mombasa','Kenya','Mombasa','Changamwe',-4.0228,39.5936,'+254412229000',ARRAY['cervical_screening','via_screening','surgery'],ARRAY['SHA','NHIF'],'medium','public'),
('Pandya Memorial Hospital','hospital','Dedan Kimathi Ave, Mombasa','Kenya','Mombasa','Mombasa Island',-4.0600,39.6650,'+254412230084',ARRAY['cervical_screening','mammography','surgery','oncology'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC','Britam'],'high','private'),
('Likoni Sub County Hospital','hospital','Likoni, Mombasa','Kenya','Mombasa','Likoni',-4.0825,39.6648,'+254412450000',ARRAY['cervical_screening','via_screening'],ARRAY['SHA','NHIF'],'low','public'),
('Mombasa Premier Hospital','hospital','Nyali, Mombasa','Kenya','Mombasa','Nyali',-4.0500,39.7000,'+254702095000',ARRAY['cervical_screening','mammography','oncology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC','Britam'],'high','private'),
-- KISUMU
('Jaramogi Oginga Odinga Teaching and Referral Hospital','hospital','Kakamega Rd, Kisumu','Kenya','Kisumu','Kisumu Central',-0.1022,34.7617,'+254572022777',ARRAY['cervical_screening','mammography','oncology','pathology','chemotherapy','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'high','public'),
('Aga Khan Hospital Kisumu','hospital','Otieno Oyoo St, Kisumu','Kenya','Kisumu','Kisumu Central',-0.0956,34.7603,'+254572026401',ARRAY['cervical_screening','mammography','oncology','surgery','pathology'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC','Britam','Resolution'],'high','private'),
('Kisumu County Referral Hospital','hospital','Oginga Odinga Rd, Kisumu','Kenya','Kisumu','Kisumu East',-0.0920,34.7571,'+254572023671',ARRAY['cervical_screening','basic_cancer_screening','surgery'],ARRAY['SHA','NHIF'],'medium','public'),
('Kisumu Specialist Hospital','hospital','Oginga Odinga St, Kisumu','Kenya','Kisumu','Kisumu Central',-0.1028,34.7523,'+254572020100',ARRAY['cervical_screening','mammography','oncology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'high','private'),
-- NAKURU
('Nakuru Level 5 Hospital','hospital','Nakuru-Eldoret Rd, Nakuru','Kenya','Nakuru','Nakuru Town',-0.3031,36.0800,'+254512211111',ARRAY['cervical_screening','mammography','oncology','pathology','surgery','chemotherapy'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'high','public'),
('War Memorial Hospital Nakuru','hospital','Kenyatta Ave, Nakuru','Kenya','Nakuru','Nakuru Town',-0.2842,36.0654,'+254512212345',ARRAY['cervical_screening','basic_cancer_screening','surgery'],ARRAY['SHA','NHIF'],'medium','public'),
('Naivasha County Referral Hospital','hospital','Naivasha Rd, Naivasha','Kenya','Nakuru','Naivasha',-0.7168,36.4328,'+254505020100',ARRAY['cervical_screening','via_screening','surgery'],ARRAY['SHA','NHIF'],'medium','public'),
('Nakuru Specialist Hospital','hospital','Clinic Rd, Nakuru','Kenya','Nakuru','Nakuru Town',-0.2833,36.0667,'+254512212000',ARRAY['cervical_screening','mammography','oncology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC','Britam'],'high','private'),
('Gilgil Sub County Hospital','hospital','Gilgil Town','Kenya','Nakuru','Gilgil',-0.5067,36.3183,'+254510020200',ARRAY['cervical_screening','via_screening'],ARRAY['SHA','NHIF'],'low','public'),
('Rongai Sub County Hospital','hospital','Rongai Town','Kenya','Nakuru','Rongai',-0.1667,35.8333,'+254512200100',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- KIAMBU
('Thika Level 5 Hospital','hospital','Thika-Garissa Rd, Thika','Kenya','Kiambu','Thika',-1.0332,37.0693,'+254672022222',ARRAY['cervical_screening','mammography','oncology','pathology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'high','public'),
('Kiambu County Referral Hospital','hospital','Hospital Rd, Kiambu','Kenya','Kiambu','Kiambu Town',-1.1713,36.8354,'+254662020400',ARRAY['cervical_screening','basic_cancer_screening','surgery'],ARRAY['SHA','NHIF'],'medium','public'),
('Gatundu County Referral Hospital','hospital','Gatundu Town','Kenya','Kiambu','Gatundu',-0.9978,36.9133,'+254713444000',ARRAY['cervical_screening','via_screening'],ARRAY['SHA','NHIF'],'medium','public'),
('Limuru Sub County Hospital','hospital','Limuru Town','Kenya','Kiambu','Limuru',-1.1142,36.6423,'+254722000000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
('Tigoni Level 4 Hospital','hospital','Tigoni, Limuru','Kenya','Kiambu','Tigoni',-1.0667,36.7167,'+254722100000',ARRAY['cervical_screening','via_screening'],ARRAY['SHA','NHIF'],'medium','public'),
('Ruiru Level 4 Hospital','hospital','Ruiru Town','Kenya','Kiambu','Ruiru',-1.1432,36.9610,'+254722200000',ARRAY['cervical_screening','surgery'],ARRAY['SHA','NHIF'],'medium','public'),
('Kikuyu Hospital','hospital','Kikuyu Town','Kenya','Kiambu','Kikuyu',-1.2500,36.6667,'+254720300000',ARRAY['cervical_screening','mammography','surgery','oncology'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'high','private'),
-- MACHAKOS
('Machakos Level 5 Hospital','hospital','Nairobi Rd, Machakos','Kenya','Machakos','Machakos Town',-1.5177,37.2634,'+254452021222',ARRAY['cervical_screening','mammography','oncology','pathology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'high','public'),
('Kangundo County Referral Hospital','hospital','Kangundo Town','Kenya','Machakos','Kangundo',-1.4032,37.3488,'+254720400000',ARRAY['cervical_screening','via_screening'],ARRAY['SHA','NHIF'],'low','public'),
('Matuu Sub County Hospital','hospital','Matuu Town, Yatta','Kenya','Machakos','Yatta',-1.1726,37.4878,'+254452023000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- MERU
('Meru Teaching and Referral Hospital','hospital','Hospital Rd, Meru','Kenya','Meru','Meru Town',0.0442,37.6509,'+254642030500',ARRAY['cervical_screening','mammography','oncology','pathology','surgery','chemotherapy'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'high','public'),
('Nkubu Sub County Hospital','hospital','Nkubu Town','Kenya','Meru','Imenti South',0.0033,37.6311,'+254727000001',ARRAY['cervical_screening','via_screening'],ARRAY['SHA','NHIF'],'medium','public'),
('Consolata Hospital Nkubu','hospital','Nkubu, Meru','Kenya','Meru','Imenti South',0.0100,37.6200,'+254642030200',ARRAY['cervical_screening','mammography','surgery','oncology'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'high','private'),
-- UASIN GISHU
('Moi Teaching and Referral Hospital','hospital','Nandi Rd, Eldoret','Kenya','Uasin Gishu','Eldoret',0.5143,35.2698,'+254537773000',ARRAY['cervical_screening','mammography','oncology','pathology','chemotherapy','radiotherapy','surgery','bone_marrow'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC','Britam','Resolution'],'high','public'),
('Eldoret Wagon Hospital','hospital','Uganda Rd, Eldoret','Kenya','Uasin Gishu','Eldoret',0.5188,35.2841,'+254534633155',ARRAY['cervical_screening','mammography','oncology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC','Britam'],'high','private'),
('Turbo Sub County Hospital','hospital','Turbo Town','Kenya','Uasin Gishu','Turbo',0.6248,35.0394,'+254720000002',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
('Huruma Hospital Eldoret','hospital','Huruma, Eldoret','Kenya','Uasin Gishu','Eldoret',0.5083,35.2694,'+254537771000',ARRAY['cervical_screening','mammography','surgery','oncology'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'high','private'),
-- KAKAMEGA
('Kakamega Teaching and Referral Hospital','hospital','Hospital Rd, Kakamega','Kenya','Kakamega','Kakamega Town',0.2833,34.7500,'+254563020000',ARRAY['cervical_screening','mammography','oncology','pathology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'high','public'),
('Malava County Referral Hospital','hospital','Malava Town','Kenya','Kakamega','Malava',0.3667,34.8667,'+254563030000',ARRAY['cervical_screening','via_screening'],ARRAY['SHA','NHIF'],'medium','public'),
('Mumias Sub County Hospital','hospital','Mumias Town','Kenya','Kakamega','Mumias',0.3333,34.4833,'+254563040000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
('St Mary Mission Hospital Mumias','hospital','Mumias Town','Kenya','Kakamega','Mumias West',0.3400,34.4800,'+254563041000',ARRAY['cervical_screening','mammography','surgery','oncology'],ARRAY['SHA','NHIF','AAR','Jubilee'],'medium','private'),
-- BUNGOMA
('Bungoma County Referral Hospital','hospital','Hospital Rd, Bungoma','Kenya','Bungoma','Bungoma Town',0.5635,34.5606,'+254553020000',ARRAY['cervical_screening','mammography','oncology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'medium','public'),
('Webuye County Hospital','hospital','Webuye Town','Kenya','Bungoma','Webuye',0.6167,34.7667,'+254553031000',ARRAY['cervical_screening','via_screening'],ARRAY['SHA','NHIF'],'medium','public'),
('Kimilili Sub County Hospital','hospital','Kimilili Town','Kenya','Bungoma','Kimilili',0.7833,34.7167,'+254720600000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- KILIFI
('Kilifi County Hospital','hospital','Kilifi Town','Kenya','Kilifi','Kilifi Town',-3.6300,39.8500,'+254412522500',ARRAY['cervical_screening','mammography','oncology','pathology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'high','public'),
('Malindi County Referral Hospital','hospital','Malindi Town','Kenya','Kilifi','Malindi',-3.2187,40.1169,'+254422030200',ARRAY['cervical_screening','basic_cancer_screening','surgery'],ARRAY['SHA','NHIF'],'medium','public'),
('Watamu Sub District Hospital','hospital','Watamu Town','Kenya','Kilifi','Watamu',-3.3667,40.0167,'+254720700000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- KWALE
('Kwale County Referral Hospital','hospital','Kwale Town','Kenya','Kwale','Kwale Town',-4.1739,39.4522,'+254409820125',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee'],'medium','public'),
('Msambweni County Referral Hospital','hospital','Msambweni Town','Kenya','Kwale','Msambweni',-4.4667,39.4833,'+254409830000',ARRAY['cervical_screening','via_screening'],ARRAY['SHA','NHIF'],'medium','public'),
-- KISII
('Kisii Teaching and Referral Hospital','hospital','Hospital Rd, Kisii','Kenya','Kisii','Kisii Town',-0.6817,34.7667,'+254583020000',ARRAY['cervical_screening','mammography','oncology','pathology','surgery','chemotherapy'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'high','public'),
('Ogembo Sub County Hospital','hospital','Ogembo Town','Kenya','Kisii','Kitutu Masaba',-0.7833,34.8833,'+254583030000',ARRAY['cervical_screening','via_screening'],ARRAY['SHA','NHIF'],'medium','public'),
('Nakuru Road Hospital Kisii','hospital','Nakuru Rd, Kisii','Kenya','Kisii','Kisii Town',-0.6800,34.7700,'+254583021000',ARRAY['cervical_screening','mammography','surgery','oncology'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'high','private'),
-- NYAMIRA
('Nyamira County Referral Hospital','hospital','Hospital Rd, Nyamira','Kenya','Nyamira','Nyamira Town',-0.5667,34.9333,'+254589020000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF','AAR'],'medium','public'),
('Keroka Sub County Hospital','hospital','Keroka Town','Kenya','Nyamira','Masaba South',-0.7000,34.9667,'+254721000000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- HOMA BAY
('Homa Bay County Teaching and Referral Hospital','hospital','Hospital Rd, Homa Bay','Kenya','Homa Bay','Homa Bay Town',-0.5264,34.4570,'+254593020000',ARRAY['cervical_screening','mammography','oncology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee'],'medium','public'),
('Rachuonyo Sub County Hospital','hospital','Kendu Bay','Kenya','Homa Bay','Rachuonyo North',-0.3667,34.6333,'+254721200000',ARRAY['cervical_screening','via_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- MIGORI
('Migori County Referral Hospital','hospital','Hospital Rd, Migori','Kenya','Migori','Migori Town',-1.0644,34.4731,'+254597020000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF','AAR'],'medium','public'),
('Isibania Sub County Hospital','hospital','Isibania Town','Kenya','Migori','Kuria West',-1.3167,34.2667,'+254721400000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
('Rongo Sub County Hospital','hospital','Rongo Town','Kenya','Migori','Rongo',-0.7833,34.6167,'+254721500000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- SIAYA
('Siaya County Referral Hospital','hospital','Hospital Rd, Siaya','Kenya','Siaya','Siaya Town',-0.0617,34.2883,'+254572060000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF','AAR'],'medium','public'),
('Yala Sub District Hospital','hospital','Yala Town, Gem','Kenya','Siaya','Gem',0.1000,34.5333,'+254721600000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
('Bondo Sub County Hospital','hospital','Bondo Town','Kenya','Siaya','Bondo',-0.3333,34.2667,'+254721700000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- VIHIGA
('Vihiga County Referral Hospital','hospital','Hospital Rd, Vihiga','Kenya','Vihiga','Vihiga Town',0.0833,34.7167,'+254556020000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF','AAR'],'medium','public'),
('Hamisi Sub County Hospital','hospital','Hamisi Town','Kenya','Vihiga','Hamisi',0.1167,34.6667,'+254721800000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- BUSIA
('Busia County Referral Hospital','hospital','Hospital Rd, Busia','Kenya','Busia','Busia Town',0.4606,34.1117,'+254553060000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF','AAR'],'medium','public'),
('Malaba Sub County Hospital','hospital','Malaba Town','Kenya','Busia','Teso North',0.6333,34.2833,'+254721900000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- TRANS NZOIA
('Kitale County Referral Hospital','hospital','Hospital Rd, Kitale','Kenya','Trans Nzoia','Kitale Town',1.0183,34.9958,'+254543020000',ARRAY['cervical_screening','mammography','oncology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee'],'medium','public'),
('Endebess Sub County Hospital','hospital','Endebess Town','Kenya','Trans Nzoia','Endebess',1.2833,34.8833,'+254722000000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
('Kitale Specialist Hospital','hospital','Kenyatta Rd, Kitale','Kenya','Trans Nzoia','Kitale Town',1.0200,34.9950,'+254543021000',ARRAY['cervical_screening','mammography','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'medium','private'),
-- WEST POKOT
('Kapenguria County Referral Hospital','hospital','Hospital Rd, Kapenguria','Kenya','West Pokot','Kapenguria Town',1.2350,35.1103,'+254547020000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF'],'low','public'),
('Pokot South Sub County Hospital','hospital','Sigor Town','Kenya','West Pokot','Pokot South',1.0833,35.3167,'+254722100000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- ELGEYO MARAKWET
('Iten County Referral Hospital','hospital','Hospital Rd, Iten','Kenya','Elgeyo Marakwet','Keiyo North',0.6717,35.5083,'+254730000001',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF'],'low','public'),
('Kapsowar County Hospital','hospital','Kapsowar, Marakwet East','Kenya','Elgeyo Marakwet','Marakwet East',1.2000,35.5333,'+254722200000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- BARINGO
('Kabarnet County Referral Hospital','hospital','Hospital Rd, Kabarnet','Kenya','Baringo','Baringo Central',0.4919,35.7417,'+254713000001',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF'],'low','public'),
('Eldama Ravine Sub County Hospital','hospital','Eldama Ravine','Kenya','Baringo','Koibatek',0.0564,35.7219,'+254722300000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
('Marigat Sub County Hospital','hospital','Marigat Town','Kenya','Baringo','Tiaty',0.4667,36.0833,'+254722400000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- LAIKIPIA
('Nanyuki County Referral Hospital','hospital','Hospital Rd, Nanyuki','Kenya','Laikipia','Nanyuki Town',0.0179,37.0720,'+254622020000',ARRAY['cervical_screening','mammography','oncology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'medium','public'),
('Nyahururu County Referral Hospital','hospital','Hospital Rd, Nyahururu','Kenya','Laikipia','Kinangop',-0.0333,36.3667,'+254620022000',ARRAY['cervical_screening','surgery'],ARRAY['SHA','NHIF'],'medium','public'),
('Rumuruti Sub County Hospital','hospital','Rumuruti Town','Kenya','Laikipia','Laikipia North',0.2667,36.5333,'+254722500000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- SAMBURU
('Maralal County Referral Hospital','hospital','Hospital Rd, Maralal','Kenya','Samburu','Samburu North',1.0983,36.6983,'+254722600000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF'],'low','public'),
('Wamba Sub County Hospital','hospital','Wamba Town','Kenya','Samburu','Samburu East',0.9667,37.2833,'+254722700000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- NYERI
('Nyeri County Referral Hospital','hospital','Hospital Rd, Nyeri','Kenya','Nyeri','Nyeri Town',-0.4167,36.9500,'+254614020000',ARRAY['cervical_screening','mammography','oncology','pathology','surgery','chemotherapy'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'high','public'),
('Karatina Sub District Hospital','hospital','Karatina Town','Kenya','Nyeri','Mathira',0.4833,37.1333,'+254614030000',ARRAY['cervical_screening','via_screening'],ARRAY['SHA','NHIF'],'medium','public'),
('Mukurweini Sub County Hospital','hospital','Mukurweini','Kenya','Nyeri','Mukurweini',-0.5167,36.9000,'+254722800000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
('Nyeri Specialist Hospital','hospital','Kimathi Way, Nyeri','Kenya','Nyeri','Nyeri Town',-0.4200,36.9480,'+254614021000',ARRAY['cervical_screening','mammography','surgery','oncology'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC','Britam'],'high','private'),
-- KIRINYAGA
('Kerugoya County Referral Hospital','hospital','Hospital Rd, Kerugoya','Kenya','Kirinyaga','Kirinyaga Central',-0.4989,37.2819,'+254616020000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF','AAR'],'medium','public'),
('Kutus Sub County Hospital','hospital','Kutus Town, Gichugu','Kenya','Kirinyaga','Gichugu',-0.5333,37.4500,'+254723000000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- MURANG-A
('Muranaga Level 5 Hospital','hospital','Hospital Rd, Muranaga','Kenya','Murang-a','Muranaga Town',-0.7167,37.1500,'+254609020000',ARRAY['cervical_screening','mammography','oncology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee'],'medium','public'),
('Kangema Sub County Hospital','hospital','Kangema Town','Kenya','Murang-a','Kangema',-0.8167,36.9833,'+254723100000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
('Maragua Sub County Hospital','hospital','Maragua Town','Kenya','Murang-a','Kigumo',-0.7500,37.0167,'+254723200000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- NYANDARUA
('Ol Kalou County Referral Hospital','hospital','Hospital Rd, Ol Kalou','Kenya','Nyandarua','Ol Kalou Town',-0.2667,36.3667,'+254617020000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF'],'medium','public'),
('Engineer Sub County Hospital','hospital','Engineer Town','Kenya','Nyandarua','Kinangop',-0.6333,36.6333,'+254723300000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- EMBU
('Embu Level 5 Hospital','hospital','Hospital Rd, Embu','Kenya','Embu','Embu Town',-0.5333,37.4500,'+254612020000',ARRAY['cervical_screening','mammography','oncology','pathology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee','CIC'],'high','public'),
('Runyenjes Sub County Hospital','hospital','Runyenjes Town','Kenya','Embu','Manyatta',-0.3833,37.5667,'+254723400000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- THARAKA NITHI
('Chuka County Referral Hospital','hospital','Hospital Rd, Chuka','Kenya','Tharaka Nithi','Chuka Town',-0.3383,37.6483,'+254723500000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF'],'medium','public'),
('Marimanti Sub County Hospital','hospital','Marimanti','Kenya','Tharaka Nithi','Tharaka North',0.0000,38.0000,'+254723600000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- ISIOLO
('Isiolo County Referral Hospital','hospital','Hospital Rd, Isiolo','Kenya','Isiolo','Isiolo Town',0.3542,37.5819,'+254723020000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF'],'low','public'),
('Garbatulla Sub County Hospital','hospital','Garbatulla','Kenya','Isiolo','Garbatulla',0.4667,38.5500,'+254723700000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- MARSABIT
('Marsabit County Referral Hospital','hospital','Hospital Rd, Marsabit','Kenya','Marsabit','Marsabit Town',2.3333,37.9833,'+254723800000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF'],'low','public'),
('Moyale Sub County Hospital','hospital','Moyale Town','Kenya','Marsabit','Moyale',3.5333,39.0500,'+254723900000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- WAJIR
('Wajir County Referral Hospital','hospital','Hospital Rd, Wajir','Kenya','Wajir','Wajir Town',1.7500,40.0667,'+254724000000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF'],'low','public'),
('Habaswein Sub County Hospital','hospital','Habaswein','Kenya','Wajir','Habaswein',1.0000,39.5000,'+254724100000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- MANDERA
('Mandera County Referral Hospital','hospital','Hospital Rd, Mandera','Kenya','Mandera','Mandera Town',3.9333,41.8500,'+254724200000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF'],'low','public'),
('Elwak Sub County Hospital','hospital','Elwak Town','Kenya','Mandera','Mandera West',3.9833,40.9167,'+254724300000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- GARISSA
('Garissa County Referral Hospital','hospital','Hospital Rd, Garissa','Kenya','Garissa','Garissa Town',-0.4531,39.6461,'+254467020000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF','AAR'],'low','public'),
('Dadaab Sub County Hospital','hospital','Dadaab','Kenya','Garissa','Dadaab',0.0667,40.3167,'+254724400000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- TANA RIVER
('Hola County Referral Hospital','hospital','Hospital Rd, Hola','Kenya','Tana River','Tana River Town',-1.5000,40.0333,'+254724500000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF'],'low','public'),
('Bura Sub County Hospital','hospital','Bura Town','Kenya','Tana River','Bura',-1.1333,39.9500,'+254724600000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- LAMU
('King Fahad County Hospital Lamu','hospital','Hospital Rd, Lamu','Kenya','Lamu','Lamu Town',-2.2683,40.9022,'+254424633141',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF'],'low','public'),
('Mokowe Sub County Hospital','hospital','Mokowe, Lamu West','Kenya','Lamu','Lamu West',-2.2333,40.8833,'+254724700000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- TAITA TAVETA
('Moi County Referral Hospital Voi','hospital','Hospital Rd, Voi','Kenya','Taita Taveta','Voi Town',-3.3958,38.5594,'+254437020000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF','AAR'],'medium','public'),
('Taveta Sub County Hospital','hospital','Taveta Town','Kenya','Taita Taveta','Taveta',-3.3833,37.6833,'+254724800000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- KAJIADO
('Kajiado County Referral Hospital','hospital','Hospital Rd, Kajiado','Kenya','Kajiado','Kajiado Town',-1.8500,36.7833,'+254724900000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF','AAR'],'medium','public'),
('Ngong Sub County Hospital','hospital','Ngong Town','Kenya','Kajiado','Ngong',-1.3617,36.6590,'+254725000000',ARRAY['cervical_screening','via_screening'],ARRAY['SHA','NHIF'],'low','public'),
('Loitoktok Sub County Hospital','hospital','Loitoktok Town','Kenya','Kajiado','Loitoktok',-2.9000,37.5167,'+254725100000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- MAKUENI
('Makueni County Referral Hospital','hospital','Hospital Rd, Makueni','Kenya','Makueni','Makueni Town',-1.8056,37.6289,'+254725200000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF','AAR'],'medium','public'),
('Wote Sub County Hospital','hospital','Wote Town','Kenya','Makueni','Kibwezi',-1.7833,37.6333,'+254725300000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- KITUI
('Kitui County Referral Hospital','hospital','Hospital Rd, Kitui','Kenya','Kitui','Kitui Town',-1.3667,38.0167,'+254446020000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF','AAR'],'medium','public'),
('Mutomo Sub County Hospital','hospital','Mutomo Town','Kenya','Kitui','Kitui South',-1.8367,38.2117,'+254725500000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
('Mwingi County Hospital','hospital','Mwingi Town','Kenya','Kitui','Mwingi North',-0.9333,38.0667,'+254725600000',ARRAY['cervical_screening','oncology'],ARRAY['SHA','NHIF'],'low','public'),
-- BOMET
('Bomet County Referral Hospital','hospital','Hospital Rd, Bomet','Kenya','Bomet','Bomet Town',-0.7833,35.3417,'+254725700000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF','AAR'],'medium','public'),
('Longisa County Hospital','hospital','Longisa, Chepalungu','Kenya','Bomet','Chepalungu',-0.8833,35.5167,'+254725800000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- KERICHO
('Kericho County Referral Hospital','hospital','Hospital Rd, Kericho','Kenya','Kericho','Kericho Town',-0.3692,35.2861,'+254526020000',ARRAY['cervical_screening','mammography','oncology','surgery'],ARRAY['SHA','NHIF','AAR','Jubilee'],'medium','public'),
('Litein Sub County Hospital','hospital','Litein Town','Kenya','Kericho','Belgut',-0.3667,35.4167,'+254725900000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- NANDI
('Kapsabet County Referral Hospital','hospital','Hospital Rd, Kapsabet','Kenya','Nandi','Kapsabet Town',0.2000,35.1000,'+254532020000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF','AAR'],'medium','public'),
('Nandi Hills Sub County Hospital','hospital','Nandi Hills','Kenya','Nandi','Nandi Hills',0.1000,35.1833,'+254726100000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- NAROK
('Narok County Referral Hospital','hospital','Hospital Rd, Narok','Kenya','Narok','Narok Town',-1.0833,35.8667,'+254726200000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF'],'medium','public'),
('Kilgoris Sub County Hospital','hospital','Kilgoris Town','Kenya','Narok','Trans Mara',-1.0000,34.8833,'+254726300000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public'),
-- TURKANA
('Lodwar County Referral Hospital','hospital','Hospital Rd, Lodwar','Kenya','Turkana','Lodwar Town',3.1194,35.5969,'+254543070000',ARRAY['cervical_screening','oncology','surgery'],ARRAY['SHA','NHIF'],'low','public'),
('Kakuma Sub County Hospital','hospital','Kakuma','Kenya','Turkana','Kakuma',3.7167,34.8667,'+254726400000',ARRAY['cervical_screening'],ARRAY['SHA','NHIF'],'low','public');

INSERT INTO health_workers (user_id,worker_id,specialization,assigned_regions,max_patients)
VALUES ('a0000000-0000-0000-0000-000000000003','CHW-KE-001','Community Health & Cancer Screening',ARRAY['Nairobi','Kiambu'],100)
ON CONFLICT (worker_id) DO NOTHING;
