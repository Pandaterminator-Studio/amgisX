Public Class Amgis

    Public SelectedWorld As Integer = 0
    Private Sub Amgis_Load(sender As Object, e As EventArgs) Handles MyBase.Load
        WorldHandler.LoadWorlds()

        ListBox1.Items.Clear()
        For Each world As Worlds In WorldHandler.WorldsList
            ListBox1.Items.Add(world.Name)
        Next

        TestMapRender.Show()
    End Sub

    Private Sub ListBox1_DoubleClick(sender As Object, e As EventArgs) Handles ListBox1.DoubleClick
        SelectedWorld = ListBox1.SelectedIndex
        WorldHandler.LoadWorldMaps(SelectedWorld)
        UpdateListbox(WorldHandler.MapsList)
    End Sub

    Private Sub UpdateListbox(maps As List(Of WorldsMap))
        ListBox2.Items.Clear()
        For Each map As WorldsMap In maps
            Dim listItem As String = $"{map.FileName}"
            ListBox2.Items.Add(listItem)
        Next
    End Sub

    Private Sub ListBox2_DoubleClick(sender As Object, e As EventArgs) Handles ListBox2.DoubleClick

        Dim selectedItem As Object = ListBox2.SelectedItem
        If selectedItem IsNot Nothing Then
            ' Access the value through the item's properties
            ' Assuming your values are stored in a property called "Text":
            Dim selectedValue As String = selectedItem

            WorldHandler.LoadMapData(GetWorldName(SelectedWorld), selectedValue)
            Button1.Enabled = True
        End If
    End Sub

    Public Sub Write(msg As String)
        ListBox3.Items.Add("[" & TimeOfDay.ToString & "] >> " & msg)
    End Sub

    Private Sub Button1_Click(sender As Object, e As EventArgs) Handles Button1.Click
        TestMapRender.Panel1.BackgroundImage = MapRenderer.RenderMap(0, 0)
    End Sub
End Class
