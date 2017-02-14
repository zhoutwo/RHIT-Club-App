CREATE PROCEDURE dbo.unsubscribeClub
	(@username varchar(10),
	@clubName varchar(50)
	)
AS
DELETE FROM dbo.Subscribe
WHERE rose_username = @username AND club_name = @clubName
GO
