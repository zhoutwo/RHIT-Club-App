CREATE PROCEDURE dbo.addUserToClub
	(@username varchar(10),
	@clubName varchar(50)
	)
AS
INSERT INTO dbo.Member_Of ([rose_username], [club_name])
VALUES (@username, @clubName)
GO
