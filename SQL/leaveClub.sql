CREATE PROCEDURE dbo.leaveClub
	(@username varchar(10),
	@clubName varchar(50)
	)
AS
DELETE FROM dbo.Member_Of
WHERE rose_username = @username AND club_name = @clubName
GO
