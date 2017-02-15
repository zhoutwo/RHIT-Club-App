--====================================
--  Create database trigger template 
--====================================
USE RHIT_Club_App
GO

/* Drop trigger if it is updated elsewhere */
IF OBJECT_ID ('subscribeUserWhenMemberOf', 'TR') IS NOT NULL
	DROP TRIGGER subscribeUserWhenMemberOf
GO

/* Create trigger */
CREATE TRIGGER subscribeUserWhenMemberOf ON dbo.[Member_Of] 
	AFTER INSERT
AS

INSERT INTO dbo.Subscribe
SELECT rose_username, club_name
FROM inserted
GO


