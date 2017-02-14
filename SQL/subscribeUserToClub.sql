CREATE PROCEDURE dbo.subscribeUserToClub
	(@username varchar(10),
	@clubName varchar(50)
	)
AS
INSERT INTO dbo.Subscribe([rose_username], [club_name])
VALUES (@username, @clubName)
GO
