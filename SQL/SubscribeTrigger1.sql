--====================================
--  Create database trigger template 
--====================================
USE RHIT_Club_App
GO

/* Drop trigger if it is updated elsewhere */
IF OBJECT_ID ('attemptUnsubscribe', 'TR') IS NOT NULL
	DROP TRIGGER attemptUnsubscribe
GO

/* Create trigger */
CREATE TRIGGER attemptUnsubscribe ON dbo.[Subscribe] 
	AFTER DELETE
AS

IF EXISTS (SELECT * FROM dbo.Member_Of, deleted WHERE deleted.rose_username = dbo.Member_Of.rose_username AND deleted.club_name = dbo.Member_Of.club_name)
BEGIN
	PRINT ('You cannot unsubscribe from club you are a member of')
	ROLLBACK
END 
GO


