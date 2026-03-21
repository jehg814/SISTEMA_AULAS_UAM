-- ============================================================
-- ASIGNACION DE AULAS - Periodo 20261 - Sede San Diego
-- CORREGIDO: SALON_CAMILLAS asignados correctamente
-- ============================================================

START TRANSACTION;

-- EAC1003 Secc 1M
UPDATE Oferta
SET
  Horario3 = '10-12:N2-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EAC1003'
  AND Secc = '1M'
  AND Horario3 = '10-12';

-- EAC202 Secc 1M
UPDATE Oferta
SET
  Horario3 = '9-12:E3-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EAC202'
  AND Secc = '1M'
  AND Horario3 = '9-12';

-- EAC203 Secc 1M
UPDATE Oferta
SET
  Horario2 = '5-6:R2-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EAC203'
  AND Secc = '1M'
  AND Horario2 = '5-6';

-- EAC205 Secc 2M
UPDATE Oferta
SET
  Horario2 = '1-4:N2-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EAC205'
  AND Secc = '2M'
  AND Horario2 = '1-4';

-- EAC209 Secc 1M
UPDATE Oferta
SET
  Horario2 = '5-7:R2-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EAC209'
  AND Secc = '1M'
  AND Horario2 = '5-7';

-- EAC403 Secc 1M
UPDATE Oferta
SET
  Horario5 = '3-4:E3-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EAC403'
  AND Secc = '1M'
  AND Horario5 = '3-4';

-- EAC410 Secc 1M
UPDATE Oferta
SET
  Horario3 = '5-6:R2-8'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EAC410'
  AND Secc = '1M'
  AND Horario3 = '5-6';

-- EAC502 Secc 1M
UPDATE Oferta
SET
  Horario2 = '5-6:R1-3',
  Horario3 = '11-12:R1-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EAC502'
  AND Secc = '1M'
  AND Horario2 = '5-6' AND Horario3 = '11-12';

-- EAC708 Secc 1M
UPDATE Oferta
SET
  Horario4 = '1-3:A2-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EAC708'
  AND Secc = '1M'
  AND Horario4 = '1-3';

-- ECP209 Secc 1M
UPDATE Oferta
SET
  Horario2 = '5-7:R2-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECP209'
  AND Secc = '1M'
  AND Horario2 = '5-7';

-- ECP403 Secc 1M
UPDATE Oferta
SET
  Horario5 = '3-4:E3-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECP403'
  AND Secc = '1M'
  AND Horario5 = '3-4';

-- ECP407 Secc 1M
UPDATE Oferta
SET
  Horario4 = '1-4:RPB-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECP407'
  AND Secc = '1M'
  AND Horario4 = '1-4';

-- ECP410 Secc 1M
UPDATE Oferta
SET
  Horario3 = '5-6:VPB-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECP410'
  AND Secc = '1M'
  AND Horario3 = '5-6';

-- ECP505 Secc 1M
UPDATE Oferta
SET
  Horario2 = '1-4:A1-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECP505'
  AND Secc = '1M'
  AND Horario2 = '1-4';

-- ECP707 Secc 1M
UPDATE Oferta
SET
  Horario1 = '3-4:E3-6',
  Horario2 = '8-9:E3-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECP707'
  AND Secc = '1M'
  AND Horario1 = '3-4' AND Horario2 = '8-9';

-- ECP708 Secc 1M
UPDATE Oferta
SET
  Horario4 = '1-3:A2-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECP708'
  AND Secc = '1M'
  AND Horario4 = '1-3';

-- ECP710 Secc 1M
UPDATE Oferta
SET
  Horario1 = '5-7:A2-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECP710'
  AND Secc = '1M'
  AND Horario1 = '5-7';

-- ECP903 Secc 1M
UPDATE Oferta
SET
  Horario2 = '8-9:S.AZUL'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECP903'
  AND Secc = '1M'
  AND Horario2 = '8-9';

-- ECS1026 Secc 1M
UPDATE Oferta
SET
  Horario2 = '2-4:E3-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS1026'
  AND Secc = '1M'
  AND Horario2 = '2-4';

-- ECS109 Secc 2M
UPDATE Oferta
SET
  Horario3 = '5-8:R2-9'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS109'
  AND Secc = '2M'
  AND Horario3 = '5-8';

-- ECS113 Secc 2M
UPDATE Oferta
SET
  Horario4 = '5-8:R1-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS113'
  AND Secc = '2M'
  AND Horario4 = '5-8';

-- ECS202 Secc 2M
UPDATE Oferta
SET
  Horario4 = '1-4:A2-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS202'
  AND Secc = '2M'
  AND Horario4 = '1-4';

-- ECS208 Secc 2M
UPDATE Oferta
SET
  Horario2 = '1-4:R2-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS208'
  AND Secc = '2M'
  AND Horario2 = '1-4';

-- ECS209 Secc 2M
UPDATE Oferta
SET
  Horario2 = '8-9:E1-2',
  Horario3 = '4-5:L2-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS209'
  AND Secc = '2M'
  AND Horario2 = '8-9' AND Horario3 = '4-5';

-- ECS210 Secc 2M
UPDATE Oferta
SET
  Horario1 = '8-11:N2-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS210'
  AND Secc = '2M'
  AND Horario1 = '8-11';

-- ECS305 Secc 2M
UPDATE Oferta
SET
  Horario4 = '1-4:N2-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS305'
  AND Secc = '2M'
  AND Horario4 = '1-4';

-- ECS408 Secc 1M
UPDATE Oferta
SET
  Horario2 = '3-5:A3-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS408'
  AND Secc = '1M'
  AND Horario2 = '3-5';

-- ECS503 Secc 2M
UPDATE Oferta
SET
  Horario4 = '5-7:R2-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS503'
  AND Secc = '2M'
  AND Horario4 = '5-7';

-- ECS508 Secc 1M
UPDATE Oferta
SET
  Horario2 = '3-6:A2-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS508'
  AND Secc = '1M'
  AND Horario2 = '3-6';

-- ECS508 Secc 2M
UPDATE Oferta
SET
  Horario2 = '3-6:A1-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS508'
  AND Secc = '2M'
  AND Horario2 = '3-6';

-- ECS508 Secc 3M
UPDATE Oferta
SET
  Horario2 = '5-8:R2-8'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS508'
  AND Secc = '3M'
  AND Horario2 = '5-8';

-- ECS510 Secc 2M
UPDATE Oferta
SET
  Horario3 = '1-3:N2-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS510'
  AND Secc = '2M'
  AND Horario3 = '1-3';

-- ECS510 Secc 3M
UPDATE Oferta
SET
  Horario2 = '2-4:A3-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS510'
  AND Secc = '3M'
  AND Horario2 = '2-4';

-- ECS511 Secc 3M
UPDATE Oferta
SET
  Horario4 = '6-9:R2-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS511'
  AND Secc = '3M'
  AND Horario4 = '6-9';

-- ECS512 Secc 2M
UPDATE Oferta
SET
  Horario1 = '5-8:A2-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS512'
  AND Secc = '2M'
  AND Horario1 = '5-8';

-- ECS512 Secc 3M
UPDATE Oferta
SET
  Horario1 = '6-9:E3-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS512'
  AND Secc = '3M'
  AND Horario1 = '6-9';

-- ECS513 Secc 1M
UPDATE Oferta
SET
  Horario3 = '5-8:R2-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS513'
  AND Secc = '1M'
  AND Horario3 = '5-8';

-- ECS513 Secc 2M
UPDATE Oferta
SET
  Horario2 = '7-10:E3-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS513'
  AND Secc = '2M'
  AND Horario2 = '7-10';

-- ECS513 Secc 3M
UPDATE Oferta
SET
  Horario5 = '5-8:N2-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS513'
  AND Secc = '3M'
  AND Horario5 = '5-8';

-- ECS609 Secc 1M
UPDATE Oferta
SET
  Horario2 = '3-4:L2-1',
  Horario5 = '5-6:L2-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS609'
  AND Secc = '1M'
  AND Horario2 = '3-4' AND Horario5 = '5-6';

-- ECS817 Secc 1M
UPDATE Oferta
SET
  Horario2 = '3-7:RPB-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'ECS817'
  AND Secc = '1M'
  AND Horario2 = '3-7';

-- EPS201 Secc 2M
UPDATE Oferta
SET
  Horario4 = '5-8:A2-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS201'
  AND Secc = '2M'
  AND Horario4 = '5-8';

-- EPS201 Secc 3M
UPDATE Oferta
SET
  Horario3 = '1-4:A1-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS201'
  AND Secc = '3M'
  AND Horario3 = '1-4';

-- EPS202 Secc 2M
UPDATE Oferta
SET
  Horario3 = '5-8:A2-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS202'
  AND Secc = '2M'
  AND Horario3 = '5-8';

-- EPS202 Secc 3M
UPDATE Oferta
SET
  Horario3 = '9-12:A1-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS202'
  AND Secc = '3M'
  AND Horario3 = '9-12';

-- EPS208 Secc 2M
UPDATE Oferta
SET
  Horario5 = '5-8:A1-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS208'
  AND Secc = '2M'
  AND Horario5 = '5-8';

-- EPS208 Secc 3M
UPDATE Oferta
SET
  Horario5 = '1-4:A3-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS208'
  AND Secc = '3M'
  AND Horario5 = '1-4';

-- EPS209 Secc 2M
UPDATE Oferta
SET
  Horario3 = '1-4:A1-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS209'
  AND Secc = '2M'
  AND Horario3 = '1-4';

-- EPS209 Secc 3M
UPDATE Oferta
SET
  Horario3 = '5-8:A1-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS209'
  AND Secc = '3M'
  AND Horario3 = '5-8';

-- EPS210 Secc 2M
UPDATE Oferta
SET
  Horario2 = '5-7:A1-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS210'
  AND Secc = '2M'
  AND Horario2 = '5-7';

-- EPS210 Secc 3M
UPDATE Oferta
SET
  Horario5 = '6-8:R1-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS210'
  AND Secc = '3M'
  AND Horario5 = '6-8';

-- EPS309 Secc 1M
UPDATE Oferta
SET
  Horario4 = '1-4:R3-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS309'
  AND Secc = '1M'
  AND Horario4 = '1-4';

-- EPS409 Secc 3M
UPDATE Oferta
SET
  Horario5 = '5-8:E3-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS409'
  AND Secc = '3M'
  AND Horario5 = '5-8';

-- EPS412 Secc 3M
UPDATE Oferta
SET
  Horario4 = '1-4:E3-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS412'
  AND Secc = '3M'
  AND Horario4 = '1-4';

-- EPS510 Secc 3M
UPDATE Oferta
SET
  Horario2 = '6-9:R2-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS510'
  AND Secc = '3M'
  AND Horario2 = '6-9';

-- EPS511 Secc 1M
UPDATE Oferta
SET
  Horario4 = '2-5:A1-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS511'
  AND Secc = '1M'
  AND Horario4 = '2-5';

-- EPS512 Secc 3M
UPDATE Oferta
SET
  Horario2 = '2-4:RPB-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS512'
  AND Secc = '3M'
  AND Horario2 = '2-4';

-- EPS513 Secc 3M
UPDATE Oferta
SET
  Horario3 = '4-6:A1-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS513'
  AND Secc = '3M'
  AND Horario3 = '4-6';

-- EPS514 Secc 3M
UPDATE Oferta
SET
  Horario3 = '9-12:E3-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS514'
  AND Secc = '3M'
  AND Horario3 = '9-12';

-- EPS515 Secc 1M
UPDATE Oferta
SET
  Horario4 = '6-8:A1-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS515'
  AND Secc = '1M'
  AND Horario4 = '6-8';

-- EPS608 Secc 6T
UPDATE Oferta
SET
  Horario4 = '1-4:L3-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS608'
  AND Secc = '6T'
  AND Horario4 = '1-4';

-- EPS609 Secc 6T
UPDATE Oferta
SET
  Horario4 = '2-4:L2-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS609'
  AND Secc = '6T'
  AND Horario4 = '2-4';

-- EPS614 Secc 2M
UPDATE Oferta
SET
  Horario4 = '1-4:E1-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS614'
  AND Secc = '2M'
  AND Horario4 = '1-4';

-- EPS617 Secc 1M
UPDATE Oferta
SET
  Horario1 = '2-4:N2-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS617'
  AND Secc = '1M'
  AND Horario1 = '2-4';

-- EPS707 Secc 1M
UPDATE Oferta
SET
  Horario2 = '1-4:A2-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS707'
  AND Secc = '1M'
  AND Horario2 = '1-4';

-- EPS709 Secc 1M
UPDATE Oferta
SET
  Horario4 = '3-6:A3-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS709'
  AND Secc = '1M'
  AND Horario4 = '3-6';

-- EPS709 Secc 2M
UPDATE Oferta
SET
  Horario2 = '1-4:A2-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS709'
  AND Secc = '2M'
  AND Horario2 = '1-4';

-- EPS710 Secc 3M
UPDATE Oferta
SET
  Horario1 = '1-4:A3-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS710'
  AND Secc = '3M'
  AND Horario1 = '1-4';

-- EPS712 Secc 1M
UPDATE Oferta
SET
  Horario5 = '1-4:A3-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS712'
  AND Secc = '1M'
  AND Horario5 = '1-4';

-- EPS712 Secc 3M
UPDATE Oferta
SET
  Horario4 = '1-4:A2-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS712'
  AND Secc = '3M'
  AND Horario4 = '1-4';

-- EPS809 Secc 1M
UPDATE Oferta
SET
  Horario3 = '8-11:A1-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS809'
  AND Secc = '1M'
  AND Horario3 = '8-11';

-- EPS809 Secc 2M
UPDATE Oferta
SET
  Horario3 = '2-5:V2-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS809'
  AND Secc = '2M'
  AND Horario3 = '2-5';

-- EPS809 Secc 3M
UPDATE Oferta
SET
  Horario4 = '1-4:V2-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS809'
  AND Secc = '3M'
  AND Horario4 = '1-4';

-- EPS809 Secc 4M
UPDATE Oferta
SET
  Horario3 = '1-4:A2-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS809'
  AND Secc = '4M'
  AND Horario3 = '1-4';

-- EPS810 Secc 1M
UPDATE Oferta
SET
  Horario2 = '2-5:L2-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS810'
  AND Secc = '1M'
  AND Horario2 = '2-5';

-- EPS810 Secc 2M
UPDATE Oferta
SET
  Horario2 = '5-8:A2-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS810'
  AND Secc = '2M'
  AND Horario2 = '5-8';

-- EPS810 Secc 3M
UPDATE Oferta
SET
  Horario2 = '1-4:A3-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS810'
  AND Secc = '3M'
  AND Horario2 = '1-4';

-- EPS810 Secc 4M
UPDATE Oferta
SET
  Horario2 = '1-4:V2-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS810'
  AND Secc = '4M'
  AND Horario2 = '1-4';

-- EPS810 Secc 5M
UPDATE Oferta
SET
  Horario4 = '5-8:A2-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS810'
  AND Secc = '5M'
  AND Horario4 = '5-8';

-- EPS812 Secc 1M
UPDATE Oferta
SET
  Horario4 = '1-4:V2-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS812'
  AND Secc = '1M'
  AND Horario4 = '1-4';

-- EPS812 Secc 2M
UPDATE Oferta
SET
  Horario4 = '5-8:A3-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS812'
  AND Secc = '2M'
  AND Horario4 = '5-8';

-- EPS812 Secc 3M
UPDATE Oferta
SET
  Horario1 = '5-8:V2-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS812'
  AND Secc = '3M'
  AND Horario1 = '5-8';

-- EPS812 Secc 4M
UPDATE Oferta
SET
  Horario2 = '5-8:A2-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS812'
  AND Secc = '4M'
  AND Horario2 = '5-8';

-- EPS813 Secc 1M
UPDATE Oferta
SET
  Horario1 = '1-4:V2-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS813'
  AND Secc = '1M'
  AND Horario1 = '1-4';

-- EPS813 Secc 2M
UPDATE Oferta
SET
  Horario2 = '1-4:V2-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS813'
  AND Secc = '2M'
  AND Horario2 = '1-4';

-- EPS813 Secc 3M
UPDATE Oferta
SET
  Horario3 = '5-8:A2-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS813'
  AND Secc = '3M'
  AND Horario3 = '5-8';

-- EPS813 Secc 4M
UPDATE Oferta
SET
  Horario1 = '5-8:VPB-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS813'
  AND Secc = '4M'
  AND Horario1 = '5-8';

-- EPS813 Secc 5M
UPDATE Oferta
SET
  Horario4 = '5-8:E2-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS813'
  AND Secc = '5M'
  AND Horario4 = '5-8';

-- EPS815 Secc 1M
UPDATE Oferta
SET
  Horario2 = '6-7:V2-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'EPS815'
  AND Secc = '1M'
  AND Horario2 = '6-7';

-- HAG2123 Secc 1M
UPDATE Oferta
SET
  Horario5 = '2-5:S.AZUL'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG2123'
  AND Secc = '1M'
  AND Horario5 = '2-5';

-- HAG2123 Secc 2M
UPDATE Oferta
SET
  Horario4 = '2-5:R1-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG2123'
  AND Secc = '2M'
  AND Horario4 = '2-5';

-- HAG2123 Secc 3M
UPDATE Oferta
SET
  Horario4 = '1-4:E3-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG2123'
  AND Secc = '3M'
  AND Horario4 = '1-4';

-- HAG2123 Secc 4M
UPDATE Oferta
SET
  Horario4 = '5-8:S.AZUL'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG2123'
  AND Secc = '4M'
  AND Horario4 = '5-8';

-- HAG2212 Secc 2M
UPDATE Oferta
SET
  Horario2 = '9-12:PG1-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG2212'
  AND Secc = '2M'
  AND Horario2 = '9-12';

-- HAG2212 Secc 4M
UPDATE Oferta
SET
  Horario5 = '9-12:AEP2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG2212'
  AND Secc = '4M'
  AND Horario5 = '9-12';

-- HAG3162 Secc 1M
UPDATE Oferta
SET
  Horario1 = '5-7:E3-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG3162'
  AND Secc = '1M'
  AND Horario1 = '5-7';

-- HAG4163 Secc 1M
UPDATE Oferta
SET
  Horario2 = '5-8:N2-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG4163'
  AND Secc = '1M'
  AND Horario2 = '5-8';

-- HAG4242 Secc 3M
UPDATE Oferta
SET
  Horario4 = '7-10:N2-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG4242'
  AND Secc = '3M'
  AND Horario4 = '7-10';

-- HAG5224 Secc 2M
UPDATE Oferta
SET
  Horario2 = '1-3:E3-5',
  Horario3 = '5-6:E2-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG5224'
  AND Secc = '2M'
  AND Horario2 = '1-3' AND Horario3 = '5-6';

-- HAG5224 Secc 3M
UPDATE Oferta
SET
  Horario2 = '5-6:E3-7',
  Horario3 = '1-3:E3-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG5224'
  AND Secc = '3M'
  AND Horario2 = '5-6' AND Horario3 = '1-3';

-- HAG5224 Secc 4M
UPDATE Oferta
SET
  Horario5 = '1-5:R2-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG5224'
  AND Secc = '4M'
  AND Horario5 = '1-5';

-- HAG5252 Secc 3M
UPDATE Oferta
SET
  Horario3 = '4-7:R3-9'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG5252'
  AND Secc = '3M'
  AND Horario3 = '4-7';

-- HAG5252 Secc 4M
UPDATE Oferta
SET
  Horario3 = '1-4:R1-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG5252'
  AND Secc = '4M'
  AND Horario3 = '1-4';

-- HAG5263 Secc 2M
UPDATE Oferta
SET
  Horario5 = '5-8:E3-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG5263'
  AND Secc = '2M'
  AND Horario5 = '5-8';

-- HAG5263 Secc 3M
UPDATE Oferta
SET
  Horario4 = '1-4:S.AZUL'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG5263'
  AND Secc = '3M'
  AND Horario4 = '1-4';

-- HAG5263 Secc 4M
UPDATE Oferta
SET
  Horario4 = '5-8:N2-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG5263'
  AND Secc = '4M'
  AND Horario4 = '5-8';

-- HAG5334 Secc 2M
UPDATE Oferta
SET
  Horario2 = '9-12:LAB2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG5334'
  AND Secc = '2M'
  AND Horario2 = '9-12';

-- HAG5334 Secc 3M
UPDATE Oferta
SET
  Horario2 = '1-4:R3-9'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG5334'
  AND Secc = '3M'
  AND Horario2 = '1-4';

-- HAG5334 Secc 4M
UPDATE Oferta
SET
  Horario4 = '1-4:R3-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG5334'
  AND Secc = '4M'
  AND Horario4 = '1-4';

-- HAG5382 Secc 1M
UPDATE Oferta
SET
  Horario1 = '5-8:E3-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG5382'
  AND Secc = '1M'
  AND Horario1 = '5-8';

-- HAG5382 Secc 2M
UPDATE Oferta
SET
  Horario2 = '5-8:R3-9'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG5382'
  AND Secc = '2M'
  AND Horario2 = '5-8';

-- HAG5382 Secc 3M
UPDATE Oferta
SET
  Horario1 = '1-4:S.AZUL'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG5382'
  AND Secc = '3M'
  AND Horario1 = '1-4';

-- HAG5382 Secc 4M
UPDATE Oferta
SET
  Horario2 = '1-4:VPB-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG5382'
  AND Secc = '4M'
  AND Horario2 = '1-4';

-- HAG6334 Secc 2M
UPDATE Oferta
SET
  Horario3 = '9-12:LAB1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG6334'
  AND Secc = '2M'
  AND Horario3 = '9-12';

-- HAG6373 Secc 1M
UPDATE Oferta
SET
  Horario3 = '5-7:A3-4',
  Horario4 = '2-4:A3-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG6373'
  AND Secc = '1M'
  AND Horario3 = '5-7' AND Horario4 = '2-4';

-- HAG7224 Secc 2501
UPDATE Oferta
SET
  Horario4 = '1-3:E3-13'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG7224'
  AND Secc = '2501'
  AND Horario4 = '1-3';

-- HAG7224 Secc 2M
UPDATE Oferta
SET
  Horario1 = '6-8:E3-10'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG7224'
  AND Secc = '2M'
  AND Horario1 = '6-8';

-- HAG7224 Secc 3M
UPDATE Oferta
SET
  Horario2 = '1-3:PG2-5',
  Horario3 = '3-4:PG2-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG7224'
  AND Secc = '3M'
  AND Horario2 = '1-3' AND Horario3 = '3-4';

-- HAG7234 Secc 1M
UPDATE Oferta
SET
  Horario4 = '4-6:R3-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG7234'
  AND Secc = '1M'
  AND Horario4 = '4-6';

-- HAG7253 Secc 2501
UPDATE Oferta
SET
  Horario1 = '7-12:R1-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG7253'
  AND Secc = '2501'
  AND Horario1 = '7-12';

-- HAG7262 Secc 1M
UPDATE Oferta
SET
  Horario2 = '7-9:R3-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG7262'
  AND Secc = '1M'
  AND Horario2 = '7-9';

-- HAG7262 Secc 3M
UPDATE Oferta
SET
  Horario1 = '9-11:E3-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG7262'
  AND Secc = '3M'
  AND Horario1 = '9-11';

-- HAG8224 Secc 1M
UPDATE Oferta
SET
  Horario3 = '1-2:N2-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8224'
  AND Secc = '1M'
  AND Horario3 = '1-2';

-- HAG8224 Secc 2501
UPDATE Oferta
SET
  Horario1 = '8-10:E3-5',
  Horario2 = '3-5:AEP2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8224'
  AND Secc = '2501'
  AND Horario1 = '8-10' AND Horario2 = '3-5';

-- HAG8224 Secc 2M
UPDATE Oferta
SET
  Horario3 = '4-5:E3-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8224'
  AND Secc = '2M'
  AND Horario3 = '4-5';

-- HAG8224 Secc 3M
UPDATE Oferta
SET
  Horario2 = '7-8:R1-2',
  Horario3 = '6-8:R2-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8224'
  AND Secc = '3M'
  AND Horario2 = '7-8' AND Horario3 = '6-8';

-- HAG8224 Secc 4M
UPDATE Oferta
SET
  Horario2 = '10-12:S.AZUL',
  Horario3 = '9-10:S.AZUL'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8224'
  AND Secc = '4M'
  AND Horario2 = '10-12' AND Horario3 = '9-10';

-- HAG8243 Secc 1M
UPDATE Oferta
SET
  Horario2 = '6-8:E3-1',
  Horario4 = '2-4:E2-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8243'
  AND Secc = '1M'
  AND Horario2 = '6-8' AND Horario4 = '2-4';

-- HAG8253 Secc 1M
UPDATE Oferta
SET
  Horario1 = '1-4:E3-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8253'
  AND Secc = '1M'
  AND Horario1 = '1-4';

-- HAG8253 Secc 2501
UPDATE Oferta
SET
  Horario1 = '1-4:VPB-1',
  Horario2 = '1-2:E3-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8253'
  AND Secc = '2501'
  AND Horario1 = '1-4' AND Horario2 = '1-2';

-- HAG8253 Secc 2M
UPDATE Oferta
SET
  Horario2 = '7-10:R2-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8253'
  AND Secc = '2M'
  AND Horario2 = '7-10';

-- HAG8253 Secc 3M
UPDATE Oferta
SET
  Horario1 = '5-8:S.AZUL'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8253'
  AND Secc = '3M'
  AND Horario1 = '5-8';

-- HAG8253 Secc 4M
UPDATE Oferta
SET
  Horario1 = '9-12:N2-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8253'
  AND Secc = '4M'
  AND Horario1 = '9-12';

-- HAG8264 Secc 1M
UPDATE Oferta
SET
  Horario3 = '8-11:E3-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8264'
  AND Secc = '1M'
  AND Horario3 = '8-11';

-- HAG8264 Secc 2M
UPDATE Oferta
SET
  Horario4 = '5-8:R3-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8264'
  AND Secc = '2M'
  AND Horario4 = '5-8';

-- HAG8264 Secc 3M
UPDATE Oferta
SET
  Horario2 = '2-5:PG1-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8264'
  AND Secc = '3M'
  AND Horario2 = '2-5';

-- HAG8264 Secc 4M
UPDATE Oferta
SET
  Horario5 = '3-6:E3-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8264'
  AND Secc = '4M'
  AND Horario5 = '3-6';

-- HAG8284 Secc 1M
UPDATE Oferta
SET
  Horario1 = '5-8:R1-9'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8284'
  AND Secc = '1M'
  AND Horario1 = '5-8';

-- HAG8284 Secc 2M
UPDATE Oferta
SET
  Horario1 = '1-4:R3-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8284'
  AND Secc = '2M'
  AND Horario1 = '1-4';

-- HAG8284 Secc 3M
UPDATE Oferta
SET
  Horario3 = '2-5:R3-8'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8284'
  AND Secc = '3M'
  AND Horario3 = '2-5';

-- HAG8284 Secc 4M
UPDATE Oferta
SET
  Horario2 = '6-9:V2-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8284'
  AND Secc = '4M'
  AND Horario2 = '6-9';

-- HAG8334 Secc 4M
UPDATE Oferta
SET
  Horario5 = '9-12:LAB1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8334'
  AND Secc = '4M'
  AND Horario5 = '9-12';

-- HAG8373 Secc 1M
UPDATE Oferta
SET
  Horario3 = '4-6:RPB-4',
  Horario4 = '5-7:R3-8'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8373'
  AND Secc = '1M'
  AND Horario3 = '4-6' AND Horario4 = '5-7';

-- HAG8373 Secc 2M
UPDATE Oferta
SET
  Horario3 = '1-3:E3-7',
  Horario5 = '1-3:E3-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8373'
  AND Secc = '2M'
  AND Horario3 = '1-3' AND Horario5 = '1-3';

-- HAG8373 Secc 3M
UPDATE Oferta
SET
  Horario3 = '9-11:E3-1',
  Horario5 = '4-6:E2-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8373'
  AND Secc = '3M'
  AND Horario3 = '9-11' AND Horario5 = '4-6';

-- HAG8383 Secc 1M
UPDATE Oferta
SET
  Horario3 = '4-6:V2-1',
  Horario4 = '5-7:L2-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8383'
  AND Secc = '1M'
  AND Horario3 = '4-6' AND Horario4 = '5-7';

-- HAG8383 Secc 2M
UPDATE Oferta
SET
  Horario2 = '1-3:R1-2',
  Horario3 = '1-3:R3-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8383'
  AND Secc = '2M'
  AND Horario2 = '1-3' AND Horario3 = '1-3';

-- HAG8383 Secc 3M
UPDATE Oferta
SET
  Horario3 = '9-11:R2-2',
  Horario5 = '9-11:R1-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HAG8383'
  AND Secc = '3M'
  AND Horario3 = '9-11' AND Horario5 = '9-11';

-- HLI206 Secc 2T
UPDATE Oferta
SET
  Horario1 = '1-4:N2-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI206'
  AND Secc = '2T'
  AND Horario1 = '1-4';

-- HLI207 Secc 2T
UPDATE Oferta
SET
  Horario3 = '2-5:R2-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI207'
  AND Secc = '2T'
  AND Horario3 = '2-5';

-- HLI208 Secc 2T
UPDATE Oferta
SET
  Horario1 = '6-8:R1-1',
  Horario2 = '7-8:R1-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI208'
  AND Secc = '2T'
  AND Horario1 = '6-8' AND Horario2 = '7-8';

-- HLI209 Secc 2T
UPDATE Oferta
SET
  Horario2 = '4-6:R2-2',
  Horario4 = '8-10:R2-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI209'
  AND Secc = '2T'
  AND Horario2 = '4-6' AND Horario4 = '8-10';

-- HLI210 Secc 2T
UPDATE Oferta
SET
  Horario3 = '6-8:E3-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI210'
  AND Secc = '2T'
  AND Horario3 = '6-8';

-- HLI311 Secc 1T
UPDATE Oferta
SET
  Horario2 = '9-11:N2-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI311'
  AND Secc = '1T'
  AND Horario2 = '9-11';

-- HLI407 Secc 1T
UPDATE Oferta
SET
  Horario3 = '5-8:R1-9'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI407'
  AND Secc = '1T'
  AND Horario3 = '5-8';

-- HLI409 Secc 2T
UPDATE Oferta
SET
  Horario1 = '6-8:N2-7',
  Horario5 = '6-8:N2-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI409'
  AND Secc = '2T'
  AND Horario1 = '6-8' AND Horario5 = '6-8';

-- HLI411 Secc 1T
UPDATE Oferta
SET
  Horario3 = '9-11:R1-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI411'
  AND Secc = '1T'
  AND Horario3 = '9-11';

-- HLI412 Secc 1T
UPDATE Oferta
SET
  Horario4 = '5-7:R1-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI412'
  AND Secc = '1T'
  AND Horario4 = '5-7';

-- HLI412 Secc 2T
UPDATE Oferta
SET
  Horario4 = '2-4:R3-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI412'
  AND Secc = '2T'
  AND Horario4 = '2-4';

-- HLI503 Secc 1T
UPDATE Oferta
SET
  Horario1 = '9-12:R1-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI503'
  AND Secc = '1T'
  AND Horario1 = '9-12';

-- HLI503 Secc 2T
UPDATE Oferta
SET
  Horario3 = '4-7:R2-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI503'
  AND Secc = '2T'
  AND Horario3 = '4-7';

-- HLI503 Secc 3T
UPDATE Oferta
SET
  Horario4 = '5-8:N2-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI503'
  AND Secc = '3T'
  AND Horario4 = '5-8';

-- HLI508 Secc 1T
UPDATE Oferta
SET
  Horario4 = '9-12:S.AZUL'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI508'
  AND Secc = '1T'
  AND Horario4 = '9-12';

-- HLI508 Secc 2T
UPDATE Oferta
SET
  Horario2 = '2-5:R3-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI508'
  AND Secc = '2T'
  AND Horario2 = '2-5';

-- HLI509 Secc 1T
UPDATE Oferta
SET
  Horario2 = '7-9:R1-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI509'
  AND Secc = '1T'
  AND Horario2 = '7-9';

-- HLI509 Secc 2T
UPDATE Oferta
SET
  Horario2 = '6-8:R3-1',
  Horario4 = '5-7:R2-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI509'
  AND Secc = '2T'
  AND Horario2 = '6-8' AND Horario4 = '5-7';

-- HLI509 Secc 3T
UPDATE Oferta
SET
  Horario4 = '10-12:N2-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI509'
  AND Secc = '3T'
  AND Horario4 = '10-12';

-- HLI511 Secc 3T
UPDATE Oferta
SET
  Horario4 = '1-4:N2-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI511'
  AND Secc = '3T'
  AND Horario4 = '1-4';

-- HLI512 Secc 2T
UPDATE Oferta
SET
  Horario1 = '8-10:E3-7',
  Horario2 = '9-10:E3-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI512'
  AND Secc = '2T'
  AND Horario1 = '8-10' AND Horario2 = '9-10';

-- HLI601 Secc 1M
UPDATE Oferta
SET
  Horario1 = '1-3:R1-4',
  Horario4 = '2-4:R2-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI601'
  AND Secc = '1M'
  AND Horario1 = '1-3' AND Horario4 = '2-4';

-- HLI603 Secc 1M
UPDATE Oferta
SET
  Horario4 = '9-11:R1-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI603'
  AND Secc = '1M'
  AND Horario4 = '9-11';

-- HLI610 Secc 1T
UPDATE Oferta
SET
  Horario2 = '1-4:E2-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI610'
  AND Secc = '1T'
  AND Horario2 = '1-4';

-- HLI610 Secc 3T
UPDATE Oferta
SET
  Horario1 = '4-7:R2-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI610'
  AND Secc = '3T'
  AND Horario1 = '4-7';

-- HLI713 Secc 3T
UPDATE Oferta
SET
  Horario1 = '9-11:R3-3',
  Horario2 = '1-2:R1-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI713'
  AND Secc = '3T'
  AND Horario1 = '9-11' AND Horario2 = '1-2';

-- HLI809 Secc 1T
UPDATE Oferta
SET
  Horario2 = '3-6:A3-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI809'
  AND Secc = '1T'
  AND Horario2 = '3-6';

-- HLI812 Secc 1T
UPDATE Oferta
SET
  Horario2 = '10-12:N2-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI812'
  AND Secc = '1T'
  AND Horario2 = '10-12';

-- HLI812 Secc 2T
UPDATE Oferta
SET
  Horario2 = '7-9:R3-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI812'
  AND Secc = '2T'
  AND Horario2 = '7-9';

-- HLI812 Secc 3T
UPDATE Oferta
SET
  Horario3 = '9-11:R1-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI812'
  AND Secc = '3T'
  AND Horario3 = '9-11';

-- HLI813 Secc 1T
UPDATE Oferta
SET
  Horario4 = '5-8:R1-9'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI813'
  AND Secc = '1T'
  AND Horario4 = '5-8';

-- HLI813 Secc 2T
UPDATE Oferta
SET
  Horario1 = '9-12:R3-9'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI813'
  AND Secc = '2T'
  AND Horario1 = '9-12';

-- HLI813 Secc 3T
UPDATE Oferta
SET
  Horario2 = '9-12:R2-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI813'
  AND Secc = '3T'
  AND Horario2 = '9-12';

-- HLI814 Secc 1T
UPDATE Oferta
SET
  Horario1 = '1-3:R1-1',
  Horario3 = '6-7:R2-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI814'
  AND Secc = '1T'
  AND Horario1 = '1-3' AND Horario3 = '6-7';

-- HLI814 Secc 2T
UPDATE Oferta
SET
  Horario2 = '10-11:R1-1',
  Horario4 = '5-6:R2-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI814'
  AND Secc = '2T'
  AND Horario2 = '10-11' AND Horario4 = '5-6';

-- HLI814 Secc 3T
UPDATE Oferta
SET
  Horario2 = '6-8:RPB-4',
  Horario3 = '7-8:R3-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI814'
  AND Secc = '3T'
  AND Horario2 = '6-8' AND Horario3 = '7-8';

-- HLI815 Secc 1T
UPDATE Oferta
SET
  Horario3 = '9-12:R2-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI815'
  AND Secc = '1T'
  AND Horario3 = '9-12';

-- HLI816 Secc 1T
UPDATE Oferta
SET
  Horario2 = '3-5:E1-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI816'
  AND Secc = '1T'
  AND Horario2 = '3-5';

-- HLI817 Secc 1T
UPDATE Oferta
SET
  Horario5 = '1-4:R2-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI817'
  AND Secc = '1T'
  AND Horario5 = '1-4';

-- HLI817 Secc 2T
UPDATE Oferta
SET
  Horario2 = '9-12:R2-9'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI817'
  AND Secc = '2T'
  AND Horario2 = '9-12';

-- HLI818 Secc 1T
UPDATE Oferta
SET
  Horario4 = '9-11:R2-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI818'
  AND Secc = '1T'
  AND Horario4 = '9-11';

-- HLI818 Secc 2T
UPDATE Oferta
SET
  Horario4 = '10-12:N2-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI818'
  AND Secc = '2T'
  AND Horario4 = '10-12';

-- HLI819 Secc 1T
UPDATE Oferta
SET
  Horario3 = '2-5:R1-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI819'
  AND Secc = '1T'
  AND Horario3 = '2-5';

-- HLI820 Secc 1T
UPDATE Oferta
SET
  Horario2 = '3-5:V3-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI820'
  AND Secc = '1T'
  AND Horario2 = '3-5';

-- HLI822 Secc 1T
UPDATE Oferta
SET
  Horario1 = '5-7:R1-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI822'
  AND Secc = '1T'
  AND Horario1 = '5-7';

-- HLI823 Secc 1T
UPDATE Oferta
SET
  Horario4 = '5-7:R2-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI823'
  AND Secc = '1T'
  AND Horario4 = '5-7';

-- HLI824 Secc 1T
UPDATE Oferta
SET
  Horario5 = '5-7:E3-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI824'
  AND Secc = '1T'
  AND Horario5 = '5-7';

-- HLI824 Secc 2T
UPDATE Oferta
SET
  Horario5 = '5-7:E3-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'HLI824'
  AND Secc = '2T'
  AND Horario5 = '5-7';

-- IIE216 Secc 1M
UPDATE Oferta
SET
  Horario2 = '5-6:N3-8'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'IIE216'
  AND Secc = '1M'
  AND Horario2 = '5-6';

-- IIE216 Secc 2M
UPDATE Oferta
SET
  Horario2 = '5-6:N3-9'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'IIE216'
  AND Secc = '2M'
  AND Horario2 = '5-6';

-- IIE218 Secc 2M
UPDATE Oferta
SET
  Horario2 = '1-2:N2-3',
  Horario4 = '3-5:R2-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'IIE218'
  AND Secc = '2M'
  AND Horario2 = '1-2' AND Horario4 = '3-5';

-- IIE714 Secc 1M
UPDATE Oferta
SET
  Horario3 = '2-4:LAB1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'IIE714'
  AND Secc = '1M'
  AND Horario3 = '2-4';

-- IIE715 Secc 1M
UPDATE Oferta
SET
  Horario1 = '1-2:A1-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'IIE715'
  AND Secc = '1M'
  AND Horario1 = '1-2';

-- IIE817 Secc 1M
UPDATE Oferta
SET
  Horario4 = '1-2:LAB1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'IIE817'
  AND Secc = '1M'
  AND Horario4 = '1-2';

-- IIE909 Secc 1M
UPDATE Oferta
SET
  Horario1 = '7-9:N3-8'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'IIE909'
  AND Secc = '1M'
  AND Horario1 = '7-9';

-- MPC702 Secc 6T
UPDATE Oferta
SET
  Horario2 = '1-3:R2-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'MPC702'
  AND Secc = '6T'
  AND Horario2 = '1-3';

-- MPC705 Secc 6T
UPDATE Oferta
SET
  Horario5 = '3-4:R3-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'MPC705'
  AND Secc = '6T'
  AND Horario5 = '3-4';

-- MPC801 Secc 6T
UPDATE Oferta
SET
  Horario4 = '2-4:E2-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'MPC801'
  AND Secc = '6T'
  AND Horario4 = '2-4';

-- MPC805 Secc 6T
UPDATE Oferta
SET
  Horario5 = '5-7:R1-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'MPC805'
  AND Secc = '6T'
  AND Horario5 = '5-7';

-- MPC808 Secc 6T
UPDATE Oferta
SET
  Horario5 = '3-5:A3-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'MPC808'
  AND Secc = '6T'
  AND Horario5 = '3-5';

-- SLC207 Secc 1M
UPDATE Oferta
SET
  Horario2 = '4-5:RPB-1',
  Horario3 = '4-6:RPB-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLC207'
  AND Secc = '1M'
  AND Horario2 = '4-5' AND Horario3 = '4-6';

-- SLC402 Secc 1
UPDATE Oferta
SET
  Horario5 = '8-9:S.AZUL'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLC402'
  AND Secc = '1'
  AND Horario5 = '8-9';

-- SLC404 Secc 1
UPDATE Oferta
SET
  Horario1 = '8-11:E3-1;12-13:E3-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLC404'
  AND Secc = '1'
  AND Horario1 = '8-11;12-13';

-- SLC405 Secc 1
UPDATE Oferta
SET
  Horario3 = '9-11:E3-7',
  Horario4 = '9-11:E3-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLC405'
  AND Secc = '1'
  AND Horario3 = '9-11' AND Horario4 = '9-11';

-- SLC607 Secc 1
UPDATE Oferta
SET
  Horario3 = '8-9:N2-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLC607'
  AND Secc = '1'
  AND Horario3 = '8-9';

-- SLC803 Secc 1M
UPDATE Oferta
SET
  Horario3 = '9-10:R3-9'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLC803'
  AND Secc = '1M'
  AND Horario3 = '9-10';

-- SLC804 Secc 1M
UPDATE Oferta
SET
  Horario2 = '2-3:LAB.MEC'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLC804'
  AND Secc = '1M'
  AND Horario2 = '2-3';

-- SLC805 Secc 1M
UPDATE Oferta
SET
  Horario4 = '2-5:L2-2',
  Horario5 = '2-5:L2-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLC805'
  AND Secc = '1M'
  AND Horario4 = '2-5' AND Horario5 = '2-5';

-- SLF203 Secc 1M
UPDATE Oferta
SET
  Horario4 = '1-4:R2-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLF203'
  AND Secc = '1M'
  AND Horario4 = '1-4';

-- SLF208 Secc 4M
UPDATE Oferta
SET
  Horario4 = '2-5:RPB-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLF208'
  AND Secc = '4M'
  AND Horario4 = '2-5';

-- SLF501 Secc 2T
UPDATE Oferta
SET
  Horario4 = '8-10:R1-8'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLF501'
  AND Secc = '2T'
  AND Horario4 = '8-10';

-- SLF503 Secc 2T
UPDATE Oferta
SET
  Horario1 = '9-13:N2-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLF503'
  AND Secc = '2T'
  AND Horario1 = '9-13';

-- SLF703 Secc 2T
UPDATE Oferta
SET
  Horario2 = '9-13:N2-5'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLF703'
  AND Secc = '2T'
  AND Horario2 = '9-13';

-- SLF703 Secc 3T
UPDATE Oferta
SET
  Horario2 = '8-12:N3-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLF703'
  AND Secc = '3T'
  AND Horario2 = '8-12';

-- SLF705 Secc 2T
UPDATE Oferta
SET
  Horario3 = '10-13:R3-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLF705'
  AND Secc = '2T'
  AND Horario3 = '10-13';

-- SLF707 Secc 2T
UPDATE Oferta
SET
  Horario4 = '8-12:E3-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLF707'
  AND Secc = '2T'
  AND Horario4 = '8-12';

-- SLF801 Secc 2T
UPDATE Oferta
SET
  Horario4 = '9-13:N2-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLF801'
  AND Secc = '2T'
  AND Horario4 = '9-13';

-- SLF802 Secc 3T
UPDATE Oferta
SET
  Horario2 = '9-13:N3-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLF802'
  AND Secc = '3T'
  AND Horario2 = '9-13';

-- SLF803 Secc 2T
UPDATE Oferta
SET
  Horario1 = '9-13:N3-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLF803'
  AND Secc = '2T'
  AND Horario1 = '9-13';

-- SLF806 Secc 2T
UPDATE Oferta
SET
  Horario5 = '8-10:E3-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLF806'
  AND Secc = '2T'
  AND Horario5 = '8-10';

-- SLF808 Secc 2M
UPDATE Oferta
SET
  Horario5 = '3-5:V1-2'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLF808'
  AND Secc = '2M'
  AND Horario5 = '3-5';

-- SLF809 Secc 2T
UPDATE Oferta
SET
  Horario5 = '11-13:N2-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLF809'
  AND Secc = '2T'
  AND Horario5 = '11-13';

-- SLF813 Secc 1M
UPDATE Oferta
SET
  Horario5 = '1-3:R1-4'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLF813'
  AND Secc = '1M'
  AND Horario5 = '1-3';

-- SLF813 Secc 1T
UPDATE Oferta
SET
  Horario4 = '9-11:R2-3'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLF813'
  AND Secc = '1T'
  AND Horario4 = '9-11';

-- SLH207 Secc 1
UPDATE Oferta
SET
  Horario2 = '4-5:LAB.COL',
  Horario3 = '4-5:LAB.COL'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLH207'
  AND Secc = '1'
  AND Horario2 = '4-5' AND Horario3 = '4-5';

-- SLH210 Secc 1
UPDATE Oferta
SET
  Horario1 = '2-5:LAB.COL'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLH210'
  AND Secc = '1'
  AND Horario1 = '2-5';

-- SLH607 Secc 1
UPDATE Oferta
SET
  Horario3 = '8-9:R1-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLH607'
  AND Secc = '1'
  AND Horario3 = '8-9';

-- SLH803 Secc 1M
UPDATE Oferta
SET
  Horario3 = '9-10:VPB-1'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLH803'
  AND Secc = '1M'
  AND Horario3 = '9-10';

-- SLH805 Secc 1M
UPDATE Oferta
SET
  Horario4 = '2-5:AEP2',
  Horario5 = '2-5:R3-9'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'SLH805'
  AND Secc = '1M'
  AND Horario4 = '2-5' AND Horario5 = '2-5';

-- STI108 Secc 1M
UPDATE Oferta
SET
  Horario5 = '4-8:E3-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'STI108'
  AND Secc = '1M'
  AND Horario5 = '4-8';

-- STI110 Secc 1M
UPDATE Oferta
SET
  Horario1 = '1-4:E3-7'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'STI110'
  AND Secc = '1M'
  AND Horario1 = '1-4';

-- STI601 Secc 2T
UPDATE Oferta
SET
  Horario3 = '4-6:R3-6'
WHERE CodPeriodo = '20261'
  AND CodAsignatura = 'STI601'
  AND Secc = '2T'
  AND Horario3 = '4-6';

-- Verificacion: debe reportar 240 filas afectadas en total

COMMIT;