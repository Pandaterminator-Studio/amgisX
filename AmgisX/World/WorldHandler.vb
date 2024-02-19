Imports System.IO
Public Class Worlds
    Public Property Id As Integer
    Public Property Name As String
End Class
Public Class WorldsMap
    Public Property WorldID As Integer
    Public Property Id As Integer
    Public Property FileName As String
    Public Property Width As Integer
    Public Property Height As Integer
    Public Property LocationX As Integer
    Public Property LocationY As Integer
End Class
Public Class MapData
    Public Property WorldID As Integer
    Public Property Id As Integer
    Public Property LayerName As String
    Public Property MapWidth As Integer
    Public Property MapHeight As Integer
    Public Property TileWidth As Integer
    Public Property TileHeight As Integer
    Public Property LayerGridData As String
End Class
Module WorldHandler

    Private ReadOnly BasePath As String = My.Application.Info.DirectoryPath.ToString & "/GameData/Worlds/"
    Public WorldsList As New List(Of Worlds)
    Public MapsList As New List(Of WorldsMap)
    Public MapDataList As New List(Of MapData)

    Public Sub LoadWorlds() 'This will load the worlds from the world file.
        Try
            Amgis.Write("Loading Worlds.wrld file..")
            Dim sr As New StreamReader(BasePath & "Worlds.wrld")
            Dim line As String

            While Not sr.EndOfStream
                line = sr.ReadLine()

                ' Extract world order and name
                Dim parts As String() = line.Split("|"c)
                Dim order As Integer = Integer.Parse(parts(0))
                Dim worldName As String = Trim(parts(1))

                WorldsList.Add(New Worlds With {.Id = order, .Name = worldName})
            End While

            sr.Close()
            Amgis.Write("Done loading Worlds.wrld file!")
        Catch ex As Exception
            MsgBox(ex.Message)
        End Try
    End Sub
    Public Sub LoadWorldMaps(WorldID As Integer)
        Try
            Amgis.Write("Loading world maps file(s)..")
            Dim WorldName As String = GetWorldName(WorldID)

            If Not String.IsNullOrEmpty(WorldName) Then
                Dim mapPath As String = BasePath & "/" & WorldName & "/" & WorldName & ".maps"

                Using sr As New StreamReader(mapPath)
                    Dim line As String

                    While Not sr.EndOfStream
                        line = sr.ReadLine()
                        Dim parts As String() = line.Split("|"c)
                        Dim order As Integer = Integer.Parse(parts(0))
                        Dim mapFileName As String = Trim(parts(1))
                        Dim mapWidth As Integer = Integer.Parse(parts(2))
                        Dim mapHeight As Integer = Integer.Parse(parts(3))
                        Dim mapLocationX As Integer = Integer.Parse(parts(4))
                        Dim mapLocationY As Integer = Integer.Parse(parts(5))

                        MapsList.Add(New WorldsMap With {.WorldID = WorldID, .Id = order, .FileName = mapFileName, .Width = mapWidth, .Height = mapHeight, .LocationX = mapLocationX, .LocationY = mapLocationY})

                    End While
                End Using
                Amgis.Write("Done loading world maps file(s) !")
            Else
                MsgBox("Invalid world index.")
            End If
        Catch ex As Exception
            MsgBox("Error loading world maps: " & ex.Message)
        End Try
    End Sub
    Public Sub LoadMapData(WorldName As String, mapFileName As String)
        Try
            Amgis.Write("Loading map data from map(s) file(s)..")
            Using sr As New StreamReader(BasePath & "/" & WorldName & "/" & mapFileName)
                Dim line As String
                line = sr.ReadToEnd()


                Dim headerParts As String() = line.Split("|"c)

                MapDataList.Add(New MapData With {
                                .WorldID = GetWorldIndex(WorldName),
                                .Id = Integer.Parse(headerParts(0)),
                                .LayerName = headerParts(1),
                                .TileWidth = Integer.Parse(headerParts(2)),
                                .TileHeight = Integer.Parse(headerParts(3)),
                                .MapWidth = Integer.Parse(headerParts(4)),
                                .MapHeight = Integer.Parse(headerParts(5)),
                                .LayerGridData = headerParts(6)
                })

            End Using
            Amgis.Write("Done loading map data from map(s) file(s) !")
        Catch ex As Exception
            MsgBox(ex.Message)
        End Try
    End Sub
    Public Function GetWorldName(worldIndex As Integer)
        If worldIndex >= 0 AndAlso worldIndex < WorldsList.Count Then
            Return WorldsList(worldIndex).Name
        Else
            Return String.Empty ' Return an empty string if the index is out of bounds
        End If
    End Function
    Public Function GetWorldIndex(worldName As String) As Integer
        For Each world As Worlds In WorldsList
            If world.Name = worldName Then
                Return WorldsList.IndexOf(world)
            End If
        Next
        Return -1 ' Return -1 if the world name is not found
    End Function

End Module
