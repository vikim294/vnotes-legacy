import { useEffect, useState } from 'react'

import { type NodeData, type NoteDetailData } from '../../types'
import { useParams, useSearchParams, useNavigate } from 'react-router'
import { API_BASE_URL, verifyToken } from '../../api'
import NoteGraph from '../../components/NoteGraph'

function NoteDetail() {
    const [flatTree, setFlatTree] = useState<NodeData[]>([])
    const [allowOperate, setAllowOperate] = useState(true)

    // data related
    const { id: noteId } = useParams()
    const [searchParams] = useSearchParams()
    const navigate = useNavigate()
    const noteTitle = searchParams.get('label') || 'Untitled Note'
    const [noteDetail, setNoteDetail] = useState<NoteDetailData | null>(null)

    const getNoteDetail = async () => {
        const response = await fetch(`${API_BASE_URL}/noteDetails/${noteId}`)
        const res = await response.json()
        if (res.code === 0) {
            const isShared = res.data.isShared
            const storedToken = localStorage.getItem('vnote')
            const validToken = storedToken ? await verifyToken(storedToken) : false

            if (!isShared && !validToken) {
                navigate('/unauthorized')
                return
            }

            setAllowOperate(validToken)
            setNoteDetail(res.data.detail)
            setFlatTree(
                res.data.nodes.map((node: NodeData) => ({
                    ...node,
                    x: Number(node.x),
                    y: Number(node.y),
                    imageWidth: Number(node.imageWidth),
                    imageHeight: Number(node.imageHeight),
                }))
            )
        }
    }

    useEffect(() => {
        if (noteId) {
            // fetch note detail
            getNoteDetail()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [noteId])

    return (
        <NoteGraph
            graphType="detail"
            noteTitle={noteTitle}
            noteDetail={noteDetail}
            flatTree={flatTree}
            setFlatTree={setFlatTree}
            allowOperate={allowOperate}
            onExitEdit={getNoteDetail}
        />
    )
}

export default NoteDetail
