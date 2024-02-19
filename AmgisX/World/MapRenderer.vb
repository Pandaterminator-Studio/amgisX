Module MapRenderer
    Private ReadOnly TileSize As Integer = 32
    Private ReadOnly BasePath As String = My.Application.Info.DirectoryPath.ToString & "/GameData/Worlds/"
    Private _cachedTileset As Image = Nothing
    Public Function RenderMap(worldID As Integer, mapID As Integer) As Bitmap
        Dim mapData As MapData = GetMapData(worldID, mapID)
        If mapData IsNot Nothing Then
            Dim rowSeparator As Char = ":"c

            Dim mapRows As String() = mapData.LayerGridData.Split(rowSeparator)

            ' Calculate the dimensions of the map image
            Dim mapWidth As Integer = mapData.MapWidth * TileSize
            Dim mapHeight As Integer = mapData.MapHeight * TileSize

            ' Create a bitmap to represent the map
            Dim mapImage As New Bitmap(mapWidth, mapHeight)

            Using g As Graphics = Graphics.FromImage(mapImage)
                For y As Integer = 0 To mapRows.Length - 1
                    Dim tileData As String() = mapRows(y).Split(","c)
                    Dim tileValue As Integer

                    For x As Integer = 0 To tileData.Length - 1
                        ' Trim leading/trailing spaces and remove any other unwanted characters
                        Dim trimmedTileValue As String = tileData(x).Trim()

                        If Integer.TryParse(trimmedTileValue, tileValue) Then
                            Application.DoEvents()
                            Dim drawX As Integer = x * TileSize
                            Dim drawY As Integer = y * TileSize
                            DrawTile(g, tileValue, x + y * mapData.MapWidth, worldID, mapData.MapWidth)
                        Else
                            Console.WriteLine($"Invalid tile value at row: {y}, column: {x} - Value: {trimmedTileValue}")
                            ' Consider handling invalid values differently (e.g., draw a placeholder tile)
                        End If
                    Next
                Next
            End Using

            Return mapImage
        End If

        ' Return a default blank image if map data is not available
        Return New Bitmap(1, 1)
    End Function

    Private Sub DrawTile(g As Graphics, tileValue As Integer, tileIndex As Integer, worldID As Integer, mapWidth As Integer)
        Application.DoEvents()
        Dim worldName As String = WorldHandler.GetWorldName(worldID)
        If _cachedTileset Is Nothing Then
            worldName = WorldHandler.GetWorldName(worldID)
            _cachedTileset = Image.FromFile(BasePath & "/" & worldName & "/" & worldName & ".png")
        Else
            worldName = WorldHandler.GetWorldName(worldID)
        End If
        ' Load your tileset image
        Using tileset As Image = Image.FromFile(BasePath & "/" & worldName & "/" & worldName & ".png")

            ' Calculate the source rectangle for the tile in the tileset using the new logic
            Dim tilesPerRow As Integer = 8
            Dim tilesetColumns As Integer = 256 / TileSize
            Dim tilesetRows As Integer = 4256 / TileSize
            Dim row As Integer = tileValue \ tilesPerRow
            Dim col As Integer = tileValue Mod tilesPerRow
            Dim sourceX As Integer = col * TileSize
            Dim sourceY As Integer = row * TileSize
            Dim sourceRect As New Rectangle(sourceX, sourceY, TileSize, TileSize)

            ' Calculate the draw coordinates based on the tile index
            Dim drawX As Integer = (tileIndex Mod mapWidth) * TileSize
            Dim drawY As Integer = (tileIndex \ mapWidth) * TileSize

            ' Draw the tile on the map image
            g.DrawImage(_cachedTileset, drawX, drawY, sourceRect, GraphicsUnit.Pixel)
        End Using

    End Sub
    Private Function GetMapData(worldID As Integer, mapID As Integer) As MapData
        ' Assuming MapsList contains all the loaded maps
        Dim mapData As MapData = WorldHandler.MapDataList.Find(Function(map) map.WorldID = worldID AndAlso map.Id = mapID)
        Return mapData
    End Function
End Module