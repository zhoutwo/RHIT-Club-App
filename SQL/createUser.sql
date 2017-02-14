CREATE PROCEDURE dbo.createUser
	(@username varchar(10),
	@name varchar(70),
	@password varchar(35),
	@email varchar(30)
	)
AS
SET NOCOUNT ON;
INSERT INTO [dbo.User]
	([rose_username], [name], [password], [email])
VALUES (@username, @name, @password, @email)
GO
