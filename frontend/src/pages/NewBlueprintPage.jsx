import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import BlueprintForm from '../components/BlueprintForm.jsx'
import ErrorBanner from '../components/ErrorBanner.jsx'
import {
  createBlueprint,
  fetchAll,
  fetchByAuthor,
  selectErrors,
  selectLoading,
  selectAuthor as selectAuthorAction,
} from '../features/blueprints/blueprintsSlice.js'

/** Pagina de creacion; solo se alcanza a traves de PrivateRoute. */
export default function NewBlueprintPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const loading = useSelector(selectLoading)
  const errors = useSelector(selectErrors)

  const submit = async (blueprint) => {
    const action = await dispatch(createBlueprint(blueprint))
    if (action.meta.requestStatus !== 'fulfilled') return
    // Refresca el catalogo y deja la tabla apuntando al autor recien usado.
    dispatch(selectAuthorAction(blueprint.author))
    dispatch(fetchByAuthor(blueprint.author))
    dispatch(fetchAll())
    navigate('/')
  }

  return (
    <div className="narrow">
      <ErrorBanner message={errors.mutation} />
      <BlueprintForm onSubmit={submit} disabled={loading.mutation === 'loading'} />
    </div>
  )
}
